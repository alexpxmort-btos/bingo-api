import { Injectable } from '@nestjs/common';
import { IRoomRepository } from '../../domain/repositories/room.repository.interface';
import { Room } from '../../domain/entities/Room';
import { Game } from '../../domain/entities/Game';
import { Card } from '../../domain/entities/Card';
import { getFirestoreInstance } from '../../firebase/firebase.config';

@Injectable()
export class FirestoreRoomRepository implements IRoomRepository {
  private readonly collectionName = 'rooms';

  async create(room: Room): Promise<void> {
    try {
      const db = getFirestoreInstance();
      const roomData = this.roomToFirestore(room);
      
      console.log(`💾 Salvando sala ${room.code} no Cloud Firestore...`);
      
      // Salvar por código (usar código como ID do documento para busca rápida)
      const docRef = db.collection(this.collectionName).doc(room.code);
      await docRef.set(roomData);
      
      // Verificar se foi salvo
      const saved = await docRef.get();
      if (saved.exists) {
        console.log(`✅ Sala ${room.code} salva no Cloud Firestore com sucesso`);
        console.log(`   📍 Coleção: ${this.collectionName}`);
        console.log(`   📄 Documento ID: ${room.code}`);
      } else {
        throw new Error('Sala não foi salva no Firestore');
      }
    } catch (error: any) {
      console.error('❌ Erro ao salvar sala no Firestore:', error.message);
      console.error('   Detalhes:', error);
      throw new Error(`Erro ao salvar sala no Firestore: ${error.message}`);
    }
  }

  async findById(id: string): Promise<Room | null> {
    try {
      const db = getFirestoreInstance();
      
      console.log(`🔍 Buscando sala ${id} no Firestore...`);
      
      // Tentar buscar por código primeiro (mais comum)
      let doc = await db.collection(this.collectionName).doc(id).get();
      
      if (!doc.exists) {
        // Se não encontrou, tentar buscar por ID usando query
        console.log(`🔍 Buscando sala ${id} por campo 'id'...`);
        const snapshot = await db.collection(this.collectionName)
          .where('id', '==', id)
          .limit(1)
          .get();
        
        if (!snapshot.empty) {
          doc = snapshot.docs[0];
          console.log(`✅ Sala encontrada por campo 'id'`);
        }
      } else {
        console.log(`✅ Sala encontrada por código`);
      }

      if (!doc.exists) {
        console.log(`❌ Sala ${id} não encontrada no Firestore`);
        return null;
      }

      const data = doc.data();
      if (!data) {
        console.log(`❌ Dados da sala ${id} estão vazios`);
        return null;
      }

      const room = this.firestoreToRoom(doc.id, data);
      console.log(`✅ Sala ${id} carregada do Firestore`);
      return room;
    } catch (error: any) {
      console.error(`❌ Erro ao buscar sala ${id} no Firestore:`, error.message);
      throw new Error(`Erro ao buscar sala: ${error.message}`);
    }
  }

  async update(room: Room): Promise<void> {
    try {
      const db = getFirestoreInstance();
      const roomData = this.roomToFirestore(room);
      
      console.log(`💾 Atualizando sala ${room.code} no Cloud Firestore...`);
      console.log(`   📊 Dados: ${JSON.stringify(roomData).substring(0, 200)}...`);
      
      // Atualizar por código (usar código como ID do documento)
      const docRef = db.collection(this.collectionName).doc(room.code);
      await docRef.set(roomData, { merge: true });
      
      // Verificar se foi atualizado
      const updated = await docRef.get();
      if (updated.exists) {
        console.log(`✅ Sala ${room.code} atualizada no Cloud Firestore com sucesso`);
        console.log(`   📍 Coleção: ${this.collectionName}`);
        console.log(`   📄 Documento ID: ${room.code}`);
        if (room.game) {
          console.log(`   🎮 Jogo: ${room.game.id}, Números sorteados: ${room.game.drawnNumbers.length}, Vencedor: ${room.game.winner || 'Nenhum'}`);
        }
      } else {
        throw new Error('Sala não foi atualizada no Firestore');
      }
    } catch (error: any) {
      console.error('❌ Erro ao atualizar sala no Firestore:', error.message);
      console.error('   Stack:', error.stack);
      throw new Error(`Erro ao atualizar sala no Firestore: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = getFirestoreInstance();
      const room = await this.findById(id);
      
      if (room) {
        console.log(`🗑️ Deletando sala ${room.code} do Firestore...`);
        await db.collection(this.collectionName).doc(room.code).delete();
        console.log(`✅ Sala ${room.code} deletada do Firestore`);
      }
    } catch (error: any) {
      console.error('❌ Erro ao deletar sala do Firestore:', error.message);
      throw new Error(`Erro ao deletar sala: ${error.message}`);
    }
  }

  private roomToFirestore(room: Room): any {
    const roomData: any = {
      id: room.id,
      name: room.name,
      hostId: room.hostId,
      hostName: room.hostName,
      code: room.code,
      maxCards: room.maxCards,
      rules: Array.isArray(room.rules) ? room.rules : [],
      visitors: room.visitors.map(v => ({
        visitorId: v.visitorId,
        nickname: v.nickname,
        joinedAt: v.joinedAt.toISOString(),
      })),
      createdAt: room.createdAt.toISOString(),
      isActive: room.isActive,
    };

    // Serializar game de forma compatível com Firestore
    if (room.game) {
      roomData.game = {
        id: room.game.id || '',
        roomId: room.game.roomId || room.id,
        drawnNumbers: Array.isArray(room.game.drawnNumbers) ? room.game.drawnNumbers : [],
        rules: Array.isArray(room.game.rules) ? room.game.rules : [],
        winner: room.game.winner || null,
        isFinished: room.game.isFinished || false,
        startedAt: room.game.startedAt ? room.game.startedAt.toISOString() : new Date().toISOString(),
        // Converter cards para array simples (Firestore não gosta de arrays aninhados profundos)
        cards: room.game.cards.map(card => {
          // Converter células 2D em array plano para evitar problemas de aninhamento
          const cellsFlat: any[] = [];
          card.cells.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
              cellsFlat.push({
                row: rowIndex,
                col: colIndex,
                number: cell.number,
                marked: cell.marked || false,
              });
            });
          });
          
          return {
            id: card.id || '',
            ownerId: card.ownerId || '',
            ownerName: card.ownerName || '',
            cells: cellsFlat, // Array plano ao invés de array 2D
          };
        }),
      };
    } else {
      roomData.game = null;
    }

    return roomData;
  }

  private firestoreToRoom(docId: string, data: any): Room {
    return new Room({
      id: data.id,
      name: data.name,
      hostId: data.hostId,
      hostName: data.hostName,
      code: data.code,
      maxCards: data.maxCards,
      rules: data.rules,
      visitors: (data.visitors || []).map((v: any) => ({
        visitorId: v.visitorId,
        nickname: v.nickname,
        joinedAt: new Date(v.joinedAt),
      })),
      game: data.game ? new Game({
        id: data.game.id,
        roomId: data.game.roomId || data.id,
        drawnNumbers: data.game.drawnNumbers || [],
        cards: (data.game.cards || []).map((c: any) => {
          // Reconstruir células 2D a partir do array plano
          let cells2D: any[][] = [];
          
          if (c.cells && Array.isArray(c.cells)) {
            // Verificar se é array plano (novo formato) ou 2D (formato antigo)
            if (c.cells.length > 0 && c.cells[0].row !== undefined) {
              // Formato novo: array plano com row/col
              cells2D = Array(5).fill(null).map(() => Array(5).fill(null));
              c.cells.forEach((cell: any) => {
                if (cell.row !== undefined && cell.col !== undefined) {
                  if (!cells2D[cell.row]) {
                    cells2D[cell.row] = [];
                  }
                  cells2D[cell.row][cell.col] = {
                    number: cell.number,
                    marked: cell.marked || false,
                  };
                }
              });
            } else {
              // Formato antigo: array 2D
              cells2D = c.cells.map((row: any[]) =>
                row.map((cell: any) => ({
                  number: cell.number,
                  marked: cell.marked || false,
                }))
              );
            }
          }
          
          return new Card({
            id: c.id,
            ownerId: c.ownerId,
            ownerName: c.ownerName,
            cells: cells2D,
          });
        }),
        rules: data.game.rules || [],
        winner: data.game.winner || null,
        isFinished: data.game.isFinished || false,
        startedAt: new Date(data.game.startedAt || new Date()),
      }) : null,
      createdAt: new Date(data.createdAt),
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
  }
}

