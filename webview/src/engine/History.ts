export interface Command {
  execute(): void;
  undo(): void;
}

export class HistoryManager {
  private _undoStack: Command[] = [];
  private _redoStack: Command[] = [];
  private _onChange?: () => void;

  constructor(onChange?: () => void) {
    this._onChange = onChange;
  }

  public execute(command: Command): void {
    command.execute();
    this._undoStack.push(command);
    this._redoStack = []; // Clear redo stack on new action
    this._onChange?.();
  }

  public undo(): boolean {
    const cmd = this._undoStack.pop();
    if (!cmd) return false;
    cmd.undo();
    this._redoStack.push(cmd);
    this._onChange?.();
    return true;
  }

  public redo(): boolean {
    const cmd = this._redoStack.pop();
    if (!cmd) return false;
    cmd.execute();
    this._undoStack.push(cmd);
    this._onChange?.();
    return true;
  }

  public canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this._redoStack.length > 0;
  }

  public clear(): void {
    this._undoStack = [];
    this._redoStack = [];
    this._onChange?.();
  }
}
