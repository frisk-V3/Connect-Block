// ブロックの型定義
interface BlockElement extends HTMLDivElement {
  dataset: {
    x: string;
    y: string;
  };
}

class ScratchLite {
  private draggingBlock: BlockElement | null = null;
  private offset = { x: 0, y: 0 };

  constructor() {
    this.init();
  }

  private init() {
    const addBtn = document.getElementById('add-block')!;
    addBtn.addEventListener('click', () => this.createBlock());

    // ドラッグ中の動き
    document.addEventListener('mousemove', (e) => {
      if (this.draggingBlock) {
        const x = e.clientX - this.offset.x;
        const y = e.clientY - this.offset.y;
        this.draggingBlock.style.left = `${x}px`;
        this.draggingBlock.style.top = `${y}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      this.draggingBlock = null;
    });
  }

  private createBlock() {
    const block = document.createElement('div') as BlockElement;
    block.className = 'block';
    block.innerText = '10歩うごかす';
    block.style.left = '100px';
    block.style.top = '100px';

    block.addEventListener('mousedown', (e) => {
      this.draggingBlock = block;
      const rect = block.getBoundingClientRect();
      this.offset.x = e.clientX - rect.left;
      this.offset.y = e.clientY - rect.top;
    });

    document.getElementById('workspace')!.appendChild(block);
  }
}

new ScratchLite();
