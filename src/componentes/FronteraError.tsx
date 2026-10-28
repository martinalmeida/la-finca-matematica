// Si una pantalla falla al dibujarse (o no se pudo descargar), se muestra un aviso con una salida
// en vez de dejar la aplicación en blanco. Lo jugado ya está guardado en la cola.

import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode; alVolver: () => void };

export default class FronteraError extends Component<Props, { error: boolean }> {
  state = { error: false };

  static getDerivedStateFromError() {
    return { error: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="pantalla" role="alert">
        <section className="vidrio tarjeta columna centro" style={{ marginTop: 24 }}>
          <h2 style={{ margin: 0 }}>Algo salió mal</h2>
          <p style={{ margin: 0 }}>Esta pantalla no se pudo abrir. Tu avance está guardado.</p>
          <button
            type="button"
            className="boton principal"
            onClick={() => {
              this.setState({ error: false });
              this.props.alVolver();
            }}
          >
            Volver al inicio
          </button>
          <button type="button" className="boton" onClick={() => location.reload()}>
            Recargar la aplicación
          </button>
        </section>
      </main>
    );
  }
}
