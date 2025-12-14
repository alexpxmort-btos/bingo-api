import { Injectable } from '@nestjs/common';
import { IRoomRepository } from '../../domain/repositories/room.repository.interface';
import { Room } from '../../domain/entities/Room';

@Injectable()
export class InMemoryRoomRepository implements IRoomRepository {
  private rooms: Map<string, Room> = new Map();

  async create(room: Room): Promise<void> {
    this.rooms.set(room.code, room);
    this.rooms.set(room.id, room);
  }

  async findById(id: string): Promise<Room | null> {
    return this.rooms.get(id) || null;
  }

  async update(room: Room): Promise<void> {
    this.rooms.set(room.code, room);
    this.rooms.set(room.id, room);
  }

  async delete(id: string): Promise<void> {
    const room = this.rooms.get(id);
    if (room) {
      this.rooms.delete(room.code);
      this.rooms.delete(room.id);
    }
  }
}

