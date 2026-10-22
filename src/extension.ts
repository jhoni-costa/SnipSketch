import * as vscode from 'vscode';
import * as path from 'path';
import { CapturePanel } from './panel/CapturePanel';
import { CodeSnippetPayload } from './types';

export function activate(context: vscode.ExtensionContext) {
  const handleCaptureSelection = async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('SnipSketch: No active text editor found.');
      return;
    }

    const selection = editor.selection;
    let text = editor.document.getText(selection);
    let startLine = selection.start.line + 1;

    // If no text is selected, prompt options
    if (!text || text.trim().length === 0) {
      const choice = await vscode.window.showQuickPick(
        [
          { label: 'Capture Entire File', description: 'Capture all lines in current document' },
          { label: 'Capture Current Line', description: `Line ${editor.selection.active.line + 1}` }
        ],
        { placeHolder: 'No text selected. What would you like to capture?' }
      );

      if (!choice) {
        return;
      }

      if (choice.label === 'Capture Entire File') {
        text = editor.document.getText();
        startLine = 1;
      } else {
        const line = editor.document.lineAt(editor.selection.active.line);
        text = line.text;
        startLine = line.lineNumber + 1;
      }
    }

    const config = vscode.workspace.getConfiguration('snipsketch');
    const snippet: CodeSnippetPayload = {
      code: text,
      language: editor.document.languageId || 'plaintext',
      fileName: path.basename(editor.document.fileName) || 'untitled',
      startLine,
      theme: config.get<string>('theme', 'one-dark-pro'),
      showLineNumbers: config.get<boolean>('showLineNumbers', true),
      showWindowControls: config.get<boolean>('showWindowControls', true),
      padding: config.get<number>('padding', 32),
      fontFamily: config.get<string>('fontFamily', "JetBrains Mono, Fira Code, Menlo, Monaco, 'Courier New', monospace")
    };

    CapturePanel.createOrShow(context.extensionUri, snippet);
  };

  const handleOpenEditor = () => {
    const config = vscode.workspace.getConfiguration('snipsketch');
    const defaultSnippet: CodeSnippetPayload = {
      code: `// Welcome to SnipSketch!\n// Select code in your editor and run "SnipSketch: Capture Selected Code"\n// Use the Lightshot-style toolbar below to annotate, draw arrows, and add text.\n\nfunction calculateMetrics(items: Array<number>): number {\n  return items.reduce((acc, curr) => acc + curr, 0);\n}\n\nconsole.log(calculateMetrics([10, 20, 30]));`,
      language: 'typescript',
      fileName: 'demo.ts',
      startLine: 1,
      theme: config.get<string>('theme', 'one-dark-pro'),
      showLineNumbers: config.get<boolean>('showLineNumbers', true),
      showWindowControls: config.get<boolean>('showWindowControls', true),
      padding: config.get<number>('padding', 32),
      fontFamily: config.get<string>('fontFamily', "JetBrains Mono, Fira Code, Menlo, Monaco, 'Courier New', monospace")
    };

    CapturePanel.createOrShow(context.extensionUri, defaultSnippet);
  };

  // Register main commands and backwards-compatible aliases
  const commands = [
    vscode.commands.registerCommand('snipsketch.captureSelection', handleCaptureSelection),
    vscode.commands.registerCommand('snipsketch.openEditor', handleOpenEditor),
    vscode.commands.registerCommand('vs-capture.captureSelection', handleCaptureSelection),
    vscode.commands.registerCommand('vs-capture.openEditor', handleOpenEditor)
  ];

  context.subscriptions.push(...commands);
}

export function deactivate() {
  if (CapturePanel.currentPanel) {
    CapturePanel.currentPanel.dispose();
  }
}
