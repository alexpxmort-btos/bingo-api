export interface CardCell {
  number: number;
  marked: boolean;
}

export interface CardProps {
  id: string;
  ownerId: string;
  ownerName: string;
  cells: CardCell[][];
}

export class Card {
  public readonly id: string;
  public readonly ownerId: string;
  public readonly ownerName: string;
  public cells: CardCell[][];

  constructor(props: CardProps) {
    this.id = props.id;
    this.ownerId = props.ownerId;
    this.ownerName = props.ownerName;
    this.cells = props.cells;
  }

  markNumber(number: number): void {
    for (let i = 0; i < this.cells.length; i++) {
      for (let j = 0; j < this.cells[i].length; j++) {
        if (this.cells[i][j].number === number) {
          this.cells[i][j].marked = true;
          return;
        }
      }
    }
  }

  checkLine(lineIndex: number): boolean {
    if (lineIndex < 0 || lineIndex >= this.cells.length) return false;
    return this.cells[lineIndex].every(cell => cell.marked);
  }

  checkColumn(columnIndex: number): boolean {
    if (columnIndex < 0 || columnIndex >= this.cells[0]?.length) return false;
    return this.cells.every(row => row[columnIndex]?.marked);
  }

  checkFull(): boolean {
    return this.cells.every(row => row.every(cell => cell.marked));
  }

  checkDiagonal(main: boolean = true): boolean {
    const size = Math.min(this.cells.length, this.cells[0]?.length || 0);
    if (main) {
      return Array.from({ length: size }, (_, i) => this.cells[i]?.[i])
        .every(cell => cell?.marked);
    } else {
      return Array.from({ length: size }, (_, i) => this.cells[i]?.[size - 1 - i])
        .every(cell => cell?.marked);
    }
  }

  static generate(ownerId: string, ownerName: string): Card {
    const id = `card-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const numbers = Card.generateBingoNumbers();
    const cells: CardCell[][] = [];
    
    for (let i = 0; i < 5; i++) {
      const row: CardCell[] = [];
      for (let j = 0; j < 5; j++) {
        row.push({
          number: numbers[i * 5 + j],
          marked: false
        });
      }
      cells.push(row);
    }

    return new Card({ id, ownerId, ownerName, cells });
  }

  private static generateBingoNumbers(): number[] {
    const numbers: number[] = [];
    const used = new Set<number>();

    while (numbers.length < 25) {
      const num = Math.floor(Math.random() * 75) + 1;
      if (!used.has(num)) {
        used.add(num);
        numbers.push(num);
      }
    }

    return numbers;
  }
}

