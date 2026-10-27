// Realidad aumentada con LocAR.js (https://github.com/AR-js-org/locar.js) y three.js.
// - La cámara trasera llega con el Webcam de LocAR.
// - La brújula y el giroscopio del celular mueven la cámara 3D con DeviceOrientationControls.
// - Los objetos de la finca se anclan en el mundo con LocAR.add (longitud, latitud, altura):
//   quedan quietos en su sitio aunque el niño gire el celular, y hay que buscarlos alrededor.
// No se usa el GPS: el origen es un punto fijo (fakeGps) y los objetos se ponen a pocos metros.
// Así funciona en el aula, sin pedir la ubicación y sin internet. La imagen de la cámara solo
// se muestra en pantalla: no se graba ni se envía.
// Sin sensores de movimiento (computador), se mira alrededor arrastrando el dedo o el ratón.

import * as THREE from 'three';
import { DeviceOrientationControls, LocAR, Webcam } from 'locar';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { DibujoObjeto } from '../componentes/Ilustraciones';
import type { ConfigEscena } from '../componentes/escenaConfig';
import type { Objeto } from '../juego/tipos';

/** Origen fijo de la escena: casco urbano de San Vicente de Chucurí (aproximado). */
const ORIGEN = { lon: -73.4119, lat: 6.8817 };
const METROS_POR_GRADO_LAT = 110_574;
const METROS_POR_GRADO_LON = 111_320 * Math.cos((ORIGEN.lat * Math.PI) / 180);
/** Campo de visión horizontal de la cámara 3D (como una cámara de celular). */
const HFOV = 70;
/** Tamaño de cada objeto en el mundo, en metros. */
const TAMANO = 0.42;

export type Conteo = { total: number; contados: number; enCanasta: number };
export type EstadoMovimiento = 'esperando' | 'sensores' | 'arrastrar' | 'permiso';

type Opciones = {
  ligero: boolean;
  alCambiar: (c: Conteo) => void;
  alCamara: (estado: 'lista' | 'negada' | 'sin-camara') => void;
  alMovimiento: (estado: EstadoMovimiento) => void;
  alToque: () => void;
};

type Cosa = {
  sprite: THREE.Sprite;
  marca: number | null;
  etiqueta: THREE.Sprite | null;
  enCanasta: boolean;
  /** Hacia dónde se mueve (al meterlo o sacarlo de la canasta). */
  destino: THREE.Vector3 | null;
};

// --- Texturas a partir de los dibujos SVG de la app ---

const texturas = new Map<string, Promise<THREE.Texture>>();

function texturaDeSvg(svg: string, lado = 256): Promise<THREE.Texture> {
  const conNs = svg.includes('xmlns=') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(conNs.replace(/width="\d+"/, `width="${lado}"`).replace(/height="\d+"/, `height="${lado}"`));
  return img.decode().then(() => {
    const lienzo = document.createElement('canvas');
    lienzo.width = lienzo.height = lado;
    lienzo.getContext('2d')!.drawImage(img, 0, 0, lado, lado);
    const t = new THREE.CanvasTexture(lienzo);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}

function texturaObjeto(o: Objeto): Promise<THREE.Texture> {
  let t = texturas.get(o);
  if (!t) {
    let svg = renderToStaticMarkup(createElement(DibujoObjeto, { objeto: o, tamano: 256, etiqueta: '' }));
    // La canasta del dibujo trae frutas pintadas: en la escena va vacía para no confundir al contar.
    if (o === 'canasta') svg = svg.replace(/<circle[^>]*\/>/g, '');
    t = texturaDeSvg(svg);
    texturas.set(o, t);
  }
  return t;
}

/** Círculo verde con el número (marca de conteo). */
function texturaNumero(n: number): THREE.Texture {
  const lado = 128;
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = lado;
  const c = lienzo.getContext('2d')!;
  c.fillStyle = '#16a34a';
  c.strokeStyle = '#ffffff';
  c.lineWidth = 10;
  c.beginPath();
  c.arc(lado / 2, lado / 2, lado / 2 - 8, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillStyle = '#ffffff';
  c.font = `800 ${n > 9 ? 56 : 68}px system-ui, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(String(n), lado / 2, lado / 2 + 4);
  const t = new THREE.CanvasTexture(lienzo);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** ¿Hay que pedir permiso con un toque para usar los sensores? (iPhone y iPad) */
function pidePermisoSensores(): boolean {
  const D = (window as { DeviceOrientationEvent?: { requestPermission?: unknown } }).DeviceOrientationEvent;
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  return ios && !!D && typeof D.requestPermission === 'function';
}

export class MotorRA {
  private renderer: THREE.WebGLRenderer;
  private escena = new THREE.Scene();
  private camara: THREE.PerspectiveCamera;
  private locar: LocAR;
  private controles: DeviceOrientationControls | null = null;
  private webcam: Webcam | null = null;
  private cosas: Cosa[] = [];
  private canasta: THREE.Sprite | null = null;
  private rayo = new THREE.Raycaster();
  private dimensiones: { ancho: number; alto: number } = { ancho: 1, alto: 1 };
  private feed: { ancho: number; alto: number } | null = null;
  private observador: ResizeObserver;
  private movimiento: EstadoMovimiento = 'esperando';
  private mirada = { yaw: 0, pitch: -0.25 };
  private puntero: { x: number; y: number; yaw: number; pitch: number; movio: boolean } | null = null;
  private vivo = true;
  private temporizador = 0;
  /** Llegó al menos una lectura real de los sensores (Chrome sin sensores manda eventos vacíos). */
  private haySensores = false;
  private alOrientar = (e: Event) => {
    const o = e as DeviceOrientationEvent;
    if (o.alpha !== null || o.beta !== null) this.haySensores = true;
  };

  constructor(
    private contenedor: HTMLElement,
    private config: ConfigEscena,
    private opciones: Opciones,
  ) {
    const { ancho, alto } = this.medir();
    this.camara = new THREE.PerspectiveCamera(LocAR.htov(HFOV, ancho / alto), ancho / alto, 0.01, 200);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !opciones.ligero });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(opciones.ligero ? 1 : Math.min(2, window.devicePixelRatio || 1));
    this.renderer.domElement.className = 'lienzo-ra';
    this.contenedor.appendChild(this.renderer.domElement);
    this.escena.add(new THREE.AmbientLight(0xffffff, 1));

    this.locar = new LocAR(this.escena, this.camara);
    // Origen fijo: la cámara queda en (0, 0) del mundo y los objetos alrededor.
    this.locar.fakeGps(ORIGEN.lon, ORIGEN.lat);

    this.observador = new ResizeObserver(() => this.ajustarTamano());
    this.observador.observe(this.contenedor);
    this.ajustarTamano();

    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.alBajar);
    el.addEventListener('pointermove', this.alMover);
    el.addEventListener('pointerup', this.alSubir);
    el.addEventListener('pointercancel', this.alCancelar);

    this.renderer.setAnimationLoop(this.cuadro);
  }

  /** Abre la cámara, los sensores y pone los objetos. */
  iniciar(): void {
    this.abrirCamara();
    this.iniciarSensores();
    // Los objetos se ponen hacia donde mira el niño: se espera un momento a la brújula.
    this.temporizador = window.setTimeout(() => void this.poner(), 900);
  }

  /** iPhone: el permiso de los sensores se pide con un toque (lo llama un botón). */
  pedirPermisoMovimiento(): void {
    this.controles?.requestOrientationPermissions();
    // Si aun así no llegan datos (permiso negado), se mira alrededor arrastrando.
    window.setTimeout(() => {
      if (this.vivo && !this.haySensores) this.cambiarMovimiento('arrastrar');
    }, 1500);
  }

  /** Modo «contar cosas de verdad»: quita todas las marcas. */
  borrarMarcas(): void {
    for (const c of this.cosas) this.quitar(c);
    this.cosas = [];
    this.avisar();
  }

  destruir(): void {
    this.vivo = false;
    window.clearTimeout(this.temporizador);
    this.renderer.setAnimationLoop(null);
    this.observador.disconnect();
    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this.alBajar);
    el.removeEventListener('pointermove', this.alMover);
    el.removeEventListener('pointerup', this.alSubir);
    el.removeEventListener('pointercancel', this.alCancelar);
    if (this.controles) window.removeEventListener(this.controles.orientationChangeEventName, this.alOrientar);
    this.controles?.disconnect();
    this.controles?.dispose();
    // Webcam.dispose apaga la cámara y quita el video del DOM.
    this.webcam?.dispose();
    for (const c of this.cosas) this.quitar(c);
    if (this.canasta) this.quitar({ sprite: this.canasta, etiqueta: null, marca: null, enCanasta: false, destino: null });
    this.renderer.dispose();
    el.remove();
  }

  // --- Cámara y sensores ---

  private abrirCamara(): void {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.opciones.alCamara('sin-camara');
      return;
    }
    const video = document.createElement('video');
    video.id = `video-ra-${Math.random().toString(36).slice(2)}`;
    video.className = 'video-ra';
    video.muted = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('autoplay', 'true');
    video.setAttribute('aria-hidden', 'true');
    this.contenedor.prepend(video);
    const alto = this.opciones.ligero ? 480 : 720;
    // LocAR tipa solo facingMode, pero pasa las restricciones tal cual a getUserMedia.
    const restricciones = { audio: false, video: { facingMode: 'environment', height: { ideal: alto } } } as unknown as { video: { facingMode: string } };
    this.webcam = new Webcam(restricciones, `#${video.id}`);
    this.webcam.on('webcamstarted', (e: { videoWidth: number; videoHeight: number }) => {
      if (!this.vivo) return;
      this.feed = { ancho: e.videoWidth, alto: e.videoHeight };
      this.ajustarTamano();
      this.opciones.alCamara('lista');
    });
    this.webcam.on('webcamerror', (e: { code: string }) => {
      if (!this.vivo) return;
      this.opciones.alCamara(e.code === 'NotAllowedError' || e.code === 'SecurityError' ? 'negada' : 'sin-camara');
    });
  }

  private iniciarSensores(): void {
    const controles = new DeviceOrientationControls(this.camara, { smoothingFactor: 0.2, enablePermissionDialog: false });
    this.controles = controles;
    window.addEventListener(controles.orientationChangeEventName, this.alOrientar);
    controles.on('deviceorientationgranted', () => {
      controles.connect();
      // Si en un momento no llegan datos de los sensores, se mira alrededor arrastrando.
      window.setTimeout(() => {
        if (!this.vivo || this.movimiento === 'sensores') return;
        if (!this.haySensores) this.cambiarMovimiento(pidePermisoSensores() ? 'permiso' : 'arrastrar');
      }, 1200);
    });
    controles.on('deviceorientationerror', () => this.cambiarMovimiento('arrastrar'));
    controles.init();
  }

  private cambiarMovimiento(m: EstadoMovimiento): void {
    if (this.movimiento === m) return;
    this.movimiento = m;
    if (m === 'arrastrar') this.controles?.disconnect();
    this.opciones.alMovimiento(m);
  }

  private medir(): { ancho: number; alto: number } {
    const r = this.contenedor.getBoundingClientRect();
    return { ancho: Math.max(1, r.width), alto: Math.max(1, r.height) };
  }

  /** Ajusta el lienzo y el campo de visión para que coincida con lo que se ve de la cámara. */
  private ajustarTamano(): void {
    const { ancho, alto } = this.medir();
    this.dimensiones = { ancho, alto };
    this.renderer.setSize(ancho, alto, false);
    const aspecto = ancho / alto;
    this.camara.aspect = aspecto;
    // Igual que App.matchFovToWebcam de LocAR: el video cubre la pantalla (object-fit: cover).
    if (this.feed) {
      const vertical = aspecto < 1;
      const w = vertical ? Math.min(this.feed.ancho, this.feed.alto) : Math.max(this.feed.ancho, this.feed.alto);
      const h = vertical ? Math.max(this.feed.ancho, this.feed.alto) : Math.min(this.feed.ancho, this.feed.alto);
      if (aspecto < w / h) {
        const anchoVisible = (alto / h) * w;
        this.camara.fov = LocAR.htov(LocAR.fovScale(HFOV, ancho / anchoVisible), aspecto);
      } else this.camara.fov = LocAR.htov(HFOV, aspecto);
    } else this.camara.fov = LocAR.htov(HFOV, aspecto);
    this.camara.updateProjectionMatrix();
  }

  // --- Poner objetos en el mundo ---

  /** Rumbo (radianes desde el norte, hacia el este) hacia donde mira la cámara. */
  private rumbo(): number {
    const d = new THREE.Vector3();
    this.camara.getWorldDirection(d);
    return Math.atan2(d.x, -d.z);
  }

  /** Metros al este y al norte del origen → longitud y latitud para LocAR. */
  private lonLat(este: number, norte: number): [number, number] {
    return [ORIGEN.lon + este / METROS_POR_GRADO_LON, ORIGEN.lat + norte / METROS_POR_GRADO_LAT];
  }

  /** Posición en el mundo (three.js) de un punto a cierta distancia y rumbo. */
  private puntoMundo(rumbo: number, distancia: number, altura: number): THREE.Vector3 {
    const [lon, lat] = this.lonLat(distancia * Math.sin(rumbo), distancia * Math.cos(rumbo));
    const [x, z] = this.locar.lonLatToWorldCoords(lon, lat);
    return new THREE.Vector3(x, altura, z);
  }

  /** Ancla un sprite en el mundo con LocAR. */
  private anclar(sprite: THREE.Sprite, rumbo: number, distancia: number, altura: number): void {
    const [lon, lat] = this.lonLat(distancia * Math.sin(rumbo), distancia * Math.cos(rumbo));
    this.locar.add(sprite, lon, lat, altura);
  }

  /** Posiciones en arco frente al niño, en dos filas para que no se encimen. */
  private arco(n: number, centro: number, abertura: number, hueco = 0): { rumbo: number; distancia: number; altura: number }[] {
    if (n <= 0) return [];
    const paso = n === 1 ? 0 : Math.min(0.16, (2 * abertura) / (n - 1));
    const inicio = centro - (paso * (n - 1)) / 2;
    return Array.from({ length: n }, (_, k) => {
      let rumbo = inicio + k * paso;
      if (hueco && Math.abs(rumbo - centro) < hueco) rumbo += Math.sign(rumbo - centro || 1) * hueco;
      const fila = k % 2;
      return { rumbo, distancia: fila ? 3.1 : 2.4, altura: fila ? -0.35 : -0.75 };
    });
  }

  private nuevoSprite(textura: THREE.Texture, tamano = TAMANO): THREE.Sprite {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura, transparent: true, depthWrite: false }));
    s.scale.set(tamano, tamano, 1);
    return s;
  }

  /** Puestos dentro de la canasta (una cuadrícula encima de ella). */
  private puestoCanasta(k: number, centro: number): THREE.Vector3 {
    const columnas = 5;
    const fila = Math.floor(k / columnas);
    const col = (k % columnas) - (columnas - 1) / 2;
    return this.puntoMundo(centro + col * 0.075, 2.2 + fila * 0.02, -0.72 + fila * 0.16);
  }

  private async poner(): Promise<void> {
    if (!this.vivo || this.config.modo === 'real') {
      this.avisar();
      return;
    }
    const config = this.config;
    const textura = await texturaObjeto(config.objeto);
    if (!this.vivo) return;
    const centro = this.rumbo();
    if (config.modo === 'canasta') {
      const tCanasta = await texturaObjeto('canasta');
      if (!this.vivo) return;
      this.canasta = this.nuevoSprite(tCanasta, 0.9);
      this.anclar(this.canasta, centro, 2.25, -0.95);
      for (let k = 0; k < config.dentro; k++) {
        const s = this.nuevoSprite(textura, TAMANO * 0.7);
        const p = this.puestoCanasta(k, centro);
        s.position.copy(p);
        this.escena.add(s);
        this.cosas.push({ sprite: s, marca: null, etiqueta: null, enCanasta: true, destino: null });
      }
      for (const p of this.arco(config.fuera, centro, 1.1, 0.35)) {
        const s = this.nuevoSprite(textura);
        this.anclar(s, p.rumbo, p.distancia, p.altura);
        this.cosas.push({ sprite: s, marca: null, etiqueta: null, enCanasta: false, destino: null });
      }
    } else {
      for (const p of this.arco(config.cantidad, centro, 1.25)) {
        const s = this.nuevoSprite(textura);
        this.anclar(s, p.rumbo, p.distancia, p.altura);
        this.cosas.push({ sprite: s, marca: null, etiqueta: null, enCanasta: false, destino: null });
      }
    }
    this.avisar();
  }

  private quitar(c: Cosa): void {
    this.escena.remove(c.sprite);
    c.sprite.material.dispose();
    if (c.etiqueta) {
      c.etiqueta.material.map?.dispose();
      c.etiqueta.material.dispose();
    }
  }

  private ponerEtiqueta(c: Cosa, n: number | null): void {
    if (c.etiqueta) {
      c.sprite.remove(c.etiqueta);
      c.etiqueta.material.map?.dispose();
      c.etiqueta.material.dispose();
      c.etiqueta = null;
    }
    c.marca = n;
    if (n === null) return;
    // Hijo del objeto: posición y tamaño relativos a él. En «cosas de verdad» la marca es el objeto.
    const real = this.config.modo === 'real';
    const e = this.nuevoSprite(texturaNumero(n), real ? 1 : 0.42);
    e.position.set(real ? 0 : 0.38, real ? 0 : 0.42, 0);
    e.renderOrder = 2;
    c.sprite.add(e);
    c.etiqueta = e;
  }

  private avisar(): void {
    this.opciones.alCambiar({
      total: this.cosas.length,
      contados: this.cosas.filter((c) => c.marca !== null).length,
      enCanasta: this.cosas.filter((c) => c.enCanasta).length,
    });
  }

  // --- Toques ---

  private tocar(x: number, y: number): void {
    const r = this.renderer.domElement.getBoundingClientRect();
    const p = new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    this.rayo.setFromCamera(p, this.camara);
    const golpe = this.rayo.intersectObjects(
      this.cosas.map((c) => c.sprite),
      false,
    )[0];
    const cosa = golpe ? this.cosas.find((c) => c.sprite === golpe.object) : undefined;

    if (this.config.modo === 'real') {
      if (cosa) {
        // Tocar una marca la quita; las demás se vuelven a numerar.
        this.quitar(cosa);
        this.cosas = this.cosas.filter((c) => c !== cosa);
        this.cosas.forEach((c, k) => this.ponerEtiqueta(c, k + 1));
      } else {
        // Marca anclada en el mundo, a 2,5 m en la dirección del toque: se queda sobre la cosa real.
        const d = this.rayo.ray.direction;
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, opacity: 0, depthWrite: false }));
        s.scale.set(0.4, 0.4, 1);
        const rumbo = Math.atan2(d.x, -d.z);
        const horizontal = Math.hypot(d.x, d.z) || 1;
        this.anclar(s, rumbo, 2.5 * horizontal, this.camara.position.y + 2.5 * d.y);
        const c: Cosa = { sprite: s, marca: null, etiqueta: null, enCanasta: false, destino: null };
        this.cosas.push(c);
        this.ponerEtiqueta(c, this.cosas.length);
      }
      this.opciones.alToque();
      this.avisar();
      return;
    }
    if (!cosa) return;
    this.opciones.alToque();

    if (this.config.modo === 'canasta') {
      const centro = this.canasta ? Math.atan2(this.canasta.position.x, -this.canasta.position.z) : this.rumbo();
      if (!this.config.quitar && !cosa.enCanasta) {
        cosa.enCanasta = true;
        cosa.destino = this.puestoCanasta(this.cosas.filter((c) => c.enCanasta).length - 1, centro);
        cosa.sprite.scale.set(TAMANO * 0.7, TAMANO * 0.7, 1);
      } else if (this.config.quitar && cosa.enCanasta) {
        cosa.enCanasta = false;
        const fuera = this.cosas.filter((c) => !c.enCanasta).length - 1;
        const lado = fuera % 2 ? 1 : -1;
        cosa.destino = this.puntoMundo(centro + lado * (0.5 + Math.floor(fuera / 2) * 0.14), 2.8, -0.5);
        cosa.sprite.scale.set(TAMANO, TAMANO, 1);
      }
      this.avisar();
      return;
    }

    // Contar: tocar marca con el siguiente número; volver a tocar lo desmarca y renumera.
    if (cosa.marca !== null) {
      const quitada = cosa.marca;
      this.ponerEtiqueta(cosa, null);
      for (const c of this.cosas) if (c.marca !== null && c.marca > quitada) this.ponerEtiqueta(c, c.marca - 1);
    } else this.ponerEtiqueta(cosa, this.cosas.filter((c) => c.marca !== null).length + 1);
    this.avisar();
  }

  private alBajar = (e: PointerEvent) => {
    this.puntero = { x: e.clientX, y: e.clientY, yaw: this.mirada.yaw, pitch: this.mirada.pitch, movio: false };
    this.renderer.domElement.setPointerCapture?.(e.pointerId);
  };

  private alMover = (e: PointerEvent) => {
    const p = this.puntero;
    if (!p) return;
    if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8) p.movio = true;
    if (!p.movio || this.movimiento === 'sensores') return;
    // Sin sensores: arrastrar para mirar alrededor (como mover una foto panorámica).
    const radPorPx = ((HFOV * Math.PI) / 180) / this.dimensiones.ancho;
    this.mirada.yaw = p.yaw + (e.clientX - p.x) * radPorPx;
    this.mirada.pitch = Math.max(-1.2, Math.min(1.2, p.pitch + (e.clientY - p.y) * radPorPx));
  };

  private alSubir = (e: PointerEvent) => {
    const p = this.puntero;
    this.puntero = null;
    if (p && !p.movio) this.tocar(e.clientX, e.clientY);
  };

  private alCancelar = () => {
    this.puntero = null;
  };

  // --- Cada cuadro ---

  private cuadro = () => {
    const c = this.controles;
    if (c && this.movimiento !== 'arrastrar') {
      c.update();
      if (this.haySensores && this.movimiento !== 'sensores') this.cambiarMovimiento('sensores');
    }
    if (this.movimiento !== 'sensores') {
      this.camara.rotation.set(this.mirada.pitch, this.mirada.yaw, 0, 'YXZ');
    }
    for (const cosa of this.cosas) {
      if (!cosa.destino) continue;
      cosa.sprite.position.lerp(cosa.destino, 0.18);
      if (cosa.sprite.position.distanceTo(cosa.destino) < 0.01) {
        cosa.sprite.position.copy(cosa.destino);
        cosa.destino = null;
      }
    }
    this.renderer.render(this.escena, this.camara);
  };
}
