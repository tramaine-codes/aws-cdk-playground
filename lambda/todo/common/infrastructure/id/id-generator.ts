import { nanoid } from 'nanoid';

// biome-ignore lint/complexity/noStaticOnlyClass: groups ID generation under one name
export class IdGenerator {
  static generate = () => nanoid();
}
