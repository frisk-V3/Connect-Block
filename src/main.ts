type BlockType = 'MOVE' | 'ROTATE' | 'RESET';

interface Point { x: number; y: number; }

class Block {
    public element: HTMLDivElement;
    public next: Block | null = null;
    public position: Point = { x: 0, y: 0 };

    constructor(public id: string, public type: BlockType, public label: string) {
        this.element = document.createElement('div');
        this.element.className = 'block';
        this.element.dataset.type = type;
        this.element.innerText = label;
    }
}

class ConnectBlockEngine {
    private blocks: Set<Block> = new Set();
    private activeBlock: Block | null = null;
    private dragOffset: Point = { x: 0, y: 0 };
    private actorState = { x: 0, y: 0, rotation: 0 };

    constructor() {
        this.init();
    }

    private init() {
        // パレットから生成
        document.querySelectorAll('.palette-item').forEach(item => {
            item.addEventListener('mousedown', (e) => {
                const el = e.currentTarget as HTMLElement;
                this.createNewBlock(
                    el.dataset.type as BlockType, 
                    el.innerText, 
                    e.clientX - 80, 
                    e.clientY - 24
                );
            });
        });

        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseup', () => this.handleMouseUp());
        document.getElementById('run-btn')?.addEventListener('click', () => this.executeAll());
    }

    private createNewBlock(type: BlockType, label: string, x: number, y: number) {
        const block = new Block(crypto.randomUUID(), type, label);
        block.position = { x, y };
        this.updateBlockDOM(block);
        
        block.element.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.startDragging(block, e.clientX, e.clientY);
        });

        document.getElementById('workspace')?.appendChild(block.element);
        this.blocks.add(block);
        this.startDragging(block, x + 80, y + 24); // 生成直後にドラッグ状態へ
    }

    private startDragging(block: Block, mouseX: number, mouseY: number) {
        this.activeBlock = block;
        this.activeBlock.element.classList.add('dragging');
        
        // 親との接続を解除
        for (const b of this.blocks) {
            if (b.next === block) b.next = null;
        }

        const rect = block.element.getBoundingClientRect();
        this.dragOffset = { x: mouseX - rect.left, y: mouseY - rect.top };
    }

    private handleMouseMove(e: MouseEvent) {
        if (!this.activeBlock) return;

        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;
        
        this.moveBlockRecursive(this.activeBlock, x, y);
    }

    private moveBlockRecursive(block: Block, x: number, y: number) {
        block.position = { x, y };
        this.updateBlockDOM(block);
        if (block.next) {
            this.moveBlockRecursive(block.next, x, y + 48); // 下に48pxずらして連結
        }
    }

    private handleMouseUp() {
        if (!this.activeBlock) return;

        // スナップ判定ロジック
        for (const target of this.blocks) {
            if (target === this.activeBlock || target.next) continue;

            const dx = target.position.x - this.activeBlock.position.x;
            const dy = (target.position.y + 48) - this.activeBlock.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 30) {
                target.next = this.activeBlock;
                this.moveBlockRecursive(this.activeBlock, target.position.x, target.position.y + 48);
                break;
            }
        }

        this.activeBlock.element.classList.remove('dragging');
        this.activeBlock = null;
    }

    private updateBlockDOM(block: Block) {
        block.element.style.transform = `translate(${block.position.x}px, ${block.position.y}px)`;
    }

    private async executeAll() {
        // 親がいないブロック（スタックの先頭）を抽出
        const roots = Array.from(this.blocks).filter(b => 
            !Array.from(this.blocks).some(other => other.next === b)
        );

        for (const root of roots) {
            let current: Block | null = root;
            while (current) {
                await this.processCommand(current.type);
                current = current.next;
            }
        }
    }

    private async processCommand(type: BlockType) {
        const actor = document.getElementById('actor')!;
        switch (type) {
            case 'MOVE': this.actorState.x += 20; break;
            case 'ROTATE': this.actorState.rotation += 45; break;
            case 'RESET': this.actorState = { x: 0, y: 0, rotation: 0 }; break;
        }
        
        actor.style.transform = `translate(calc(-50% + ${this.actorState.x}px), calc(-50% + ${this.actorState.y}px)) rotate(${this.actorState.rotation}deg)`;
        await new Promise(r => setTimeout(r, 300)); // 動作を見せるためのディレイ
    }
}

new ConnectBlockEngine();
