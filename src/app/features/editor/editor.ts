import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { BlockService } from '../../core/services/block.service';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/auth/auth.service';
import { Block } from '../../shared/models/portfolio.model';
import {
  BLOCK_CATALOG,
  BlockType,
  catalogEntry,
} from '../../shared/models/block-catalog.model';
import { BlockRendererComponent } from '../../shared/components/block-renderer/block-renderer';
import { SettingsPanelComponent } from './settings-panel/settings-panel';
import { CustomHtmlEditorComponent } from './custom-html-editor/custom-html-editor';

/** Contador de ids locales negativos: los ids del servidor se regeneran al guardar. */
let localBlockId = -1;

@Component({
  selector: 'app-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
    RouterLink,
    BlockRendererComponent,
    SettingsPanelComponent,
    CustomHtmlEditorComponent,
  ],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})
export class EditorComponent implements OnInit {
  readonly blockService = inject(BlockService);
  private readonly projectService = inject(ProjectService);
  private readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  readonly catalog = BLOCK_CATALOG;
  readonly selectedId = signal<number | null>(null);
  readonly username = computed(() => this.auth.user()?.username ?? '');

  readonly selectedBlock = computed(() =>
    this.blockService.blocks().find((block) => block.id === this.selectedId()) ?? null,
  );

  readonly isCustomHtmlSelected = computed(() => this.selectedBlock()?.type === 'CUSTOM_HTML');

  readonly customHtmlValue = computed(() => {
    const block = this.selectedBlock();
    if (!block) {
      return '';
    }
    try {
      return (JSON.parse(block.settings) as { html?: string }).html ?? '';
    } catch {
      return '';
    }
  });

  ngOnInit(): void {
    this.blockService.load();
    // Los proyectos alimentan el bloque PROJECTS del preview.
    this.projectService.load(0, 6);
  }

  entryLabel(type: string): string {
    return catalogEntry(type)?.label ?? type;
  }

  entryIcon(type: string): string {
    return catalogEntry(type)?.icon ?? 'help';
  }

  addBlock(type: BlockType): void {
    const entry = catalogEntry(type);
    if (!entry) {
      return;
    }
    const block: Block = {
      id: localBlockId--,
      type,
      position: this.blockService.blocks().length,
      settings: JSON.stringify(entry.createDefault()),
    };
    this.blockService.replaceAll([...this.blockService.blocks(), block]);
    this.selectedId.set(block.id);
  }

  removeBlock(block: Block): void {
    this.blockService.replaceAll(this.blockService.blocks().filter((b) => b.id !== block.id));
    if (this.selectedId() === block.id) {
      this.selectedId.set(null);
    }
  }

  toggleSelect(blockId: number): void {
    this.selectedId.set(this.selectedId() === blockId ? null : blockId);
  }

  clearSelection(): void {
    this.selectedId.set(null);
  }

  onDrop(event: CdkDragDrop<Block[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    const blocks = [...this.blockService.blocks()];
    moveItemInArray(blocks, event.previousIndex, event.currentIndex);
    this.blockService.replaceAll(blocks);
  }

  onSettingsChange(settings: string): void {
    const id = this.selectedId();
    if (id === null) {
      return;
    }
    this.updateSettings(id, settings);
  }

  onCustomHtmlChange(html: string): void {
    const block = this.selectedBlock();
    if (!block || block.type !== 'CUSTOM_HTML') {
      return;
    }
    this.updateSettings(block.id, JSON.stringify({ html }));
  }

  private updateSettings(id: number, settings: string): void {
    this.blockService.replaceAll(
      this.blockService.blocks().map((block) =>
        block.id === id ? { ...block, settings } : block,
      ),
    );
  }

  save(): void {
    if (!this.blockService.dirty() || this.blockService.saving()) {
      return;
    }
    this.blockService.save().subscribe({
      next: () => {
        // El PUT regenera los ids, asi que la seleccion deja de ser valida.
        this.selectedId.set(null);
        this.snackBar.open('Portafolio guardado', 'Cerrar', { duration: 4000 });
      },
      error: () => {
        // El error ya queda expuesto en blockService.error().
        this.snackBar.open('No se pudo guardar', 'Cerrar', { duration: 5000 });
      },
    });
  }
}
