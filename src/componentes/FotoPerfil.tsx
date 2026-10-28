// La foto del usuario si puso una; si no, su personaje.

import { Avatar } from './Ilustraciones';
import { useFoto } from '../servicios/foto';

type Props = {
  /** Id de la cuenta: la foto se busca en este celular. */
  id?: string;
  avatar: string;
  tamano?: number;
  etiqueta?: string;
  /** URL de la foto ya conocida (panel del profesor). Si viene, no se busca en el celular. */
  url?: string | null;
};

export default function FotoPerfil({ id, avatar, tamano = 64, etiqueta, url }: Props) {
  const local = useFoto(url === undefined ? id : undefined);
  const src = url ?? local;
  if (!src) return <Avatar id={avatar} tamano={tamano} etiqueta={etiqueta} />;
  return <img className="foto-perfil" src={src} width={tamano} height={tamano} alt={etiqueta ?? 'Foto de perfil'} draggable={false} />;
}
