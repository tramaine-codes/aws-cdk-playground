import { nanoid } from 'nanoid';

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class IdGenerator {
  static generate = () => nanoid();
}
