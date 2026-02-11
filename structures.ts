
export interface PriorityQueueItem<T> {
  item: T;
  priority: number; // Higher number = higher priority
}

export class PriorityQueue<T> {
  private heap: PriorityQueueItem<T>[] = [];

  constructor() {}

  enqueue(item: T, priority: number): void {
    const newNode: PriorityQueueItem<T> = { item, priority };
    this.heap.push(newNode);
    this.bubbleUp();
  }

  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    const max = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0 && end) {
      this.heap[0] = end;
      this.sinkDown();
    }
    return max.item;
  }

  peek(): T | undefined {
    return this.isEmpty() ? undefined : this.heap[0].item;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  size(): number {
    return this.heap.length;
  }

  // Helper to maintain heap property moving up
  private bubbleUp(): void {
    let outputIdx = this.heap.length - 1;
    const element = this.heap[outputIdx];

    while (outputIdx > 0) {
      let parentIdx = Math.floor((outputIdx - 1) / 2);
      let parent = this.heap[parentIdx];

      if (element.priority <= parent.priority) break;

      this.heap[parentIdx] = element;
      this.heap[outputIdx] = parent;
      outputIdx = parentIdx;
    }
  }

  // Helper to maintain heap property moving down
  private sinkDown(): void {
    let idx = 0;
    const length = this.heap.length;
    const element = this.heap[0];

    while (true) {
      let leftChildIdx = 2 * idx + 1;
      let rightChildIdx = 2 * idx + 2;
      let leftChild: PriorityQueueItem<T> | undefined;
      let rightChild: PriorityQueueItem<T> | undefined;
      let swap: number | null = null;

      if (leftChildIdx < length) {
        leftChild = this.heap[leftChildIdx];
        if (leftChild.priority > element.priority) {
          swap = leftChildIdx;
        }
      }

      if (rightChildIdx < length) {
        rightChild = this.heap[rightChildIdx];
        if (
          (swap === null && rightChild.priority > element.priority) ||
          (swap !== null && rightChild.priority > (leftChild!.priority))
        ) {
          swap = rightChildIdx;
        }
      }

      if (swap === null) break;

      this.heap[idx] = this.heap[swap];
      this.heap[swap] = element;
      idx = swap;
    }
  }
}

export class ListNode<T> {
  value: T;
  next: ListNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

export class LinkedList<T> {
  head: ListNode<T> | null = null;
  private _size: number = 0;

  constructor() {}

  add(value: T): void {
    const newNode = new ListNode(value);
    if (!this.head) {
      this.head = newNode;
    } else {
      let current = this.head;
      while (current.next) {
        current = current.next;
      }
      current.next = newNode;
    }
    this._size++;
  }

  // Insert maintaining order based on comparator
  // comparator(a, b) returns < 0 if a comes before b, 0 if equal, > 0 if a comes after b
  insertSorted(value: T, comparator: (a: T, b: T) => number): void {
    const newNode = new ListNode(value);
    if (!this.head || comparator(value, this.head.value) < 0) {
      newNode.next = this.head;
      this.head = newNode;
    } else {
      let current = this.head;
      while (current.next && comparator(value, current.next.value) >= 0) {
        current = current.next;
      }
      newNode.next = current.next;
      current.next = newNode;
    }
    this._size++;
  }

  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }
  
  isEmpty(): boolean {
      return this._size === 0;
  }

  size(): number {
    return this._size;
  }
}
