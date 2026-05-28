import { uuidv7 } from 'uuidv7';

export function newProjectId(): string {
  return uuidv7();
}
