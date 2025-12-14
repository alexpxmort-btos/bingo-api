import { Room } from '../entities/Room';

export interface IRoomRepository {
  create(room: Room): Promise<void>;
  findById(id: string): Promise<Room | null>;
  update(room: Room): Promise<void>;
  delete(id: string): Promise<void>;
}

