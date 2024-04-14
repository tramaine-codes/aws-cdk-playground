import { Todo } from '../model/todo.js';

export class TodoDto {
  constructor(
    public readonly id: string,
    private readonly todo: Todo
  ) {}

  toJSON = () => ({
    id: this.id,
    ...this.todo,
  });
}
