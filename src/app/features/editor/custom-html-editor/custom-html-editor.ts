import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';

import grapesjs, { Editor } from 'grapesjs';

/**
 * Wrapper minimo de GrapesJS (~80 lineas) para editar el HTML del bloque
 * CUSTOM_HTML. Sin storage (storageManager: false): el componente emite el
 * HTML y quien persiste es BlockService via PUT replace-all.
 */
@Component({
  selector: 'app-custom-html-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #container class="grapes-container"></div>`,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .grapes-container {
        height: 100%;
      }
    `,
  ],
})
export class CustomHtmlEditorComponent implements AfterViewInit, OnDestroy {
  readonly html = input.required<string>();
  readonly htmlChange = output<string>();

  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('container');
  private editor: Editor | null = null;
  private pendingHtml: string | null = null;

  constructor() {
    effect(() => {
      const value = this.html();
      if (this.editor) {
        const current = this.editor.getHtml();
        if (value !== current) {
          this.editor.setComponents(value);
        }
      } else {
        this.pendingHtml = value;
      }
    });
  }

  ngAfterViewInit(): void {
    this.editor = grapesjs.init({
      container: this.container().nativeElement,
      components: this.pendingHtml ?? '',
      autorender: true,
      height: '100%',
      storageManager: false,
      showOffsets: true,
      noticeOnUnload: false,
    });
    this.editor.on('update', () => {
      this.htmlChange.emit(this.editor!.getHtml());
    });
    this.pendingHtml = null;
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
    this.editor = null;
  }
}
