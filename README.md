# VS Capture 📸

> **Extensão do Visual Studio Code para captura e anotação visual de trechos de código (estilo Lightshot).**

Capture trechos de código com formatação impecável (estilo macOS/Carbon) e faça anotações visuais ricas em tempo real: adicione setas vetoriais, retângulos, elipses, marca-texto, textos explicativos, marcadores numerados de passos (1, 2, 3...) e ofuscação/pixelização de dados sensíveis.

---

## 🚀 Funcionalidades

- **Captura Instantânea de Código**: Selecione qualquer trecho de código no editor e capture com um clique ou atalho (`Cmd+Alt+C` no Mac ou `Ctrl+Alt+C` no Windows/Linux).
- **Editor Visual Estilo Lightshot**:
  - ↗️ **Setas Direcionadas**: Vetores matemáticos com ponta nítida para indicar trechos e linhas com precisão.
  - ⬜ **Retângulos e Formas**: Destaque blocos de código com caixas com cantos arredondados.
  - ⭕ **Elipses e Círculos**: Para circundar palavras-chave ou tokens específicos.
  - ✏️ **Lápis / Desenho Livre**: Curvas Bézier suaves interpoladas para anotações manuais fluidas.
  - 🖍️ **Marca-texto (Highlighter)**: Traço translúcido para destacar linhas sem esconder a sintaxe.
  - 🔤 **Texto / Comentários**: Insira caixas de texto com fundo para legibilidade em qualquer tema.
  - 🔢 **Marcador de Passos (Step Badges)**: Círculos numerados incrementais (1, 2, 3...) para tutoriais e code reviews.
  - ⬛ **Ofuscação / Pixelate (Blur)**: Oculte chaves de API, senhas ou tokens sensíveis antes de compartilhar.
- **Histórico Completo (Undo / Redo)**: Padrão *Command Pattern* com suporte a `Cmd+Z` e `Cmd+Y`.
- **Exportação de Alta Resolução (Retina 2x)**:
  - 📋 **Copiar para a Área de Transferência**: Coloque o PNG diretamente no clipboard para colar no Slack, Teams, Notion, PRs do GitHub, etc.
  - 💾 **Salvar como PNG**: Diálogo nativo para salvar a imagem no disco.
- **Renderização Visual Elegante**:
  - Janela estilo macOS com botões de controle (traffic lights).
  - Numeração de linhas sincronizada com o arquivo original.
  - Destaque de sintaxe de alta precisão via `highlight.js`.

---

## ⌨️ Atalhos de Teclado

### Comandos da Extensão
| Comando | Teclas de Atalho (Mac) | Teclas de Atalho (Win/Linux) | Descrição |
|---|---|---|---|
| `vs-capture.captureSelection` | `Cmd + Alt + C` | `Ctrl + Alt + C` | Captura o código selecionado no editor ativo |
| `vs-capture.openEditor` | Via Command Palette | Via Command Palette | Abre o editor de anotação com template |

### Ferramentas no Editor Visual
| Tecla | Ferramenta |
|---|---|
| `V` | Selecionar / Mover elemento |
| `A` | Seta direcionada (Arrow) |
| `R` | Retângulo (Rectangle) |
| `E` | Elipse / Círculo |
| `P` | Lápis / Caneta (Freehand Pen) |
| `H` | Marca-texto (Highlighter) |
| `T` | Caixa de Texto (Text) |
| `S` | Marcador de Passo (Step Badge 1, 2, 3...) |
| `B` | Ofuscar / Pixelar código sensível (Blur/Redact) |
| `Cmd/Ctrl + Z` | Desfazer (Undo) |
| `Cmd/Ctrl + Y` ou `Cmd/Ctrl + Shift + Z` | Refazer (Redo) |
| `Delete` / `Backspace` | Excluir forma selecionada |

---

## 🏛️ Arquitetura de Software e Padrões de Projeto

O projeto foi construído seguindo princípios sólidos da Ciência da Computação e Engenharia de Software:

```
vs-capture/
├── src/                          # Extension Host (Node.js / VS Code API)
│   ├── extension.ts              # Ponto de entrada e registro de comandos
│   ├── panel/                    # Gerenciador de ciclo de vida do Webview Panel
│   │   └── CapturePanel.ts
│   └── types/                    # Contratos de mensagens entre Host e Webview
│       └── index.ts
├── webview/                      # Frontend do Editor (Browser Context)
│   ├── index.html                # Estrutura base com CSP restrita
│   ├── styles/                   # Design system e folha de estilos
│   │   └── editor.css
│   └── src/
│       ├── main.ts               # Orquestrador do Webview
│       ├── types.ts              # Modelos de domínio geométricos e de ferramentas
│       ├── engine/               # Núcleo de renderização gráfica
│       │   ├── CanvasEngine.ts   # Pipeline Retina HiDPI e composição de camadas
│       │   ├── History.ts        # Implementação do Command Pattern (Undo/Redo)
│       │   └── SnippetRenderer.ts# Rasterização do código com syntax highlighting
│       ├── shapes/               # Hierarquia OOP de formas (Polimorfismo)
│       │   ├── BaseShape.ts
│       │   ├── ArrowShape.ts
│       │   ├── RectShape.ts
│       │   ├── EllipseShape.ts
│       │   ├── FreehandShape.ts
│       │   ├── TextShape.ts
│       │   ├── StepBadgeShape.ts
│       │   └── BlurShape.ts
│       └── tools/                # State Pattern para modos de interação
│           ├── ToolManager.ts
│           ├── SelectTool.ts
│           ├── ArrowTool.ts
│           ├── RectTool.ts
│           ├── EllipseTool.ts
│           ├── PenTool.ts
│           ├── TextTool.ts
│           ├── StepTool.ts
│           └── BlurTool.ts
├── esbuild.js                    # Script de bundling de alta velocidade
├── tsconfig.json                 # Configurações TypeScript em modo strict
└── package.json                  # Manifesto da extensão
```

### Padrões Aplicados:
1. **Command Pattern (`HistoryManager`)**: Cada ação do usuário (adicionar forma, mover, excluir) é encapsulada em um objeto comando com métodos `execute()` e `undo()`. Isso garante histórico transacional livre de efeitos colaterais.
2. **State Pattern (`ToolManager` e `ITool`)**: A troca de ferramentas altera o comportamento de manipulação de mouse e teclado em tempo de execução sem condicionais dispersas.
3. **Polymorphism & Template Method (`BaseShape`)**: Formas compartilham contratos para cálculo de *bounding box*, algoritmo de *hit-testing* e renderização vetorial no Canvas 2D.
4. **Offscreen Canvas Double-Buffering**: O snippet de código é rasterizado em um canvas secundário offscreen, garantindo 60fps constantes mesmo ao desenhar dezenas de formas por cima.

---

## 🛠️ Como Executar e Desenvolver

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Compilar o projeto**:
   ```bash
   npm run compile
   # Ou modo observador para desenvolvimento contínuo:
   npm run watch
   ```

3. **Executar a Extensão no VS Code**:
   - Pressione `F5` (ou acesse a aba **Run and Debug** e clique em **Run Extension**).
   - Uma nova janela (*Extension Development Host*) será aberta com a extensão carregada.
   - Abra qualquer arquivo de código, selecione um bloco de linhas e clique com o botão direito -> **VS Capture: Capture Selected Code** (ou pressione `Cmd+Alt+C`).
