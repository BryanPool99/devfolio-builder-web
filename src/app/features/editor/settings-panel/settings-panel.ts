import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormArray,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { Block } from '../../../shared/models/portfolio.model';
import {
  AboutSettings,
  ContactSettings,
  EducationSettings,
  ExperienceSettings,
  HeroSettings,
  ProjectsSettings,
  SkillsSettings,
  catalogEntry,
} from '../../../shared/models/block-catalog.model';
import { Subscription } from 'rxjs';

/**
 * Panel de configuracion del bloque seleccionado: construye un formularo
 * reactivo por tipo de bloque y emite `settingsChange` con el JSON serializado
 * en cada modificacion para que el editor lo persista en el state local.
 */
@Component({
  selector: 'app-settings-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './settings-panel.html',
  styleUrl: './settings-panel.scss',
})
export class SettingsPanelComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);

  readonly block = input.required<Block>();
  readonly settingsChange = output<string>();

  readonly form = signal<FormGroup>(this.fb.nonNullable.group({}));
  readonly entry = computed(() => catalogEntry(this.block().type));

  private subscription: Subscription | null = null;

  constructor() {
    effect(() => this.rebuild());
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private rebuild(): void {
    this.subscription?.unsubscribe();
    const block = this.block();
    const form = this.buildForm(block);
    this.form.set(form);
    this.subscription = form.valueChanges.subscribe(() => this.emit(form, block.type));
  }

  private buildForm(block: Block): FormGroup {
    const parsed = this.parse(block);
    switch (block.type) {
      case 'HERO': {
        const s = parsed as HeroSettings;
        return this.fb.nonNullable.group({
          title: [s.title ?? '', Validators.maxLength(120)],
          subtitle: [s.subtitle ?? '', Validators.maxLength(240)],
          ctaText: [s.ctaText ?? '', Validators.maxLength(60)],
          ctaLink: [s.ctaLink ?? '', Validators.maxLength(500)],
          imageUrl: [s.imageUrl ?? '', Validators.maxLength(500)],
        });
      }
      case 'ABOUT': {
        const s = parsed as AboutSettings;
        return this.fb.nonNullable.group({
          title: [s.title ?? '', Validators.maxLength(120)],
          body: [s.body ?? '', Validators.maxLength(4000)],
        });
      }
      case 'SKILLS': {
        const s = parsed as SkillsSettings;
        return this.fb.nonNullable.group({
          title: [s.title ?? '', Validators.maxLength(120)],
          itemsText: [(s.items ?? []).join('\n')],
        });
      }
      case 'PROJECTS': {
        const s = parsed as ProjectsSettings;
        return this.fb.nonNullable.group({
          title: [s.title ?? '', Validators.maxLength(120)],
          limit: [s.limit ?? 6, [Validators.min(1), Validators.max(24)]],
        });
      }
      case 'EXPERIENCE': {
        const s = parsed as ExperienceSettings;
        return this.fb.nonNullable.group({
          title: [s.title ?? '', Validators.maxLength(120)],
          items: this.fb.array((s.items ?? []).map((item) => this.experienceItem(item))),
        });
      }
      case 'EDUCATION': {
        const s = parsed as EducationSettings;
        return this.fb.nonNullable.group({
          title: [s.title ?? '', Validators.maxLength(120)],
          items: this.fb.array((s.items ?? []).map((item) => this.educationItem(item))),
        });
      }
      case 'CONTACT': {
        const s = parsed as ContactSettings;
        return this.fb.nonNullable.group({
          email: [s.email ?? '', Validators.maxLength(200)],
          socialLinks: this.fb.array(
            (s.socialLinks ?? []).map((link) => this.contactLink(link)),
          ),
        });
      }
      default:
        return this.fb.nonNullable.group({});
    }
  }

  private experienceItem(item?: Partial<ExperienceSettings['items'][number]>): FormGroup {
    return this.fb.nonNullable.group({
      role: [item?.role ?? '', Validators.maxLength(120)],
      company: [item?.company ?? '', Validators.maxLength(120)],
      period: [item?.period ?? '', Validators.maxLength(60)],
      description: [item?.description ?? '', Validators.maxLength(1000)],
    });
  }

  private educationItem(item?: Partial<EducationSettings['items'][number]>): FormGroup {
    return this.fb.nonNullable.group({
      degree: [item?.degree ?? '', Validators.maxLength(160)],
      school: [item?.school ?? '', Validators.maxLength(160)],
      period: [item?.period ?? '', Validators.maxLength(60)],
    });
  }

  private contactLink(link?: Partial<ContactSettings['socialLinks'][number]>): FormGroup {
    return this.fb.nonNullable.group({
      label: [link?.label ?? '', Validators.maxLength(60)],
      url: [link?.url ?? '', Validators.maxLength(500)],
    });
  }

  addItem(kind: 'EXPERIENCE' | 'EDUCATION' | 'CONTACT'): void {
    const items = this.form().get(kind === 'CONTACT' ? 'socialLinks' : 'items') as FormArray;
    if (kind === 'EXPERIENCE') {
      items.push(this.experienceItem());
    } else if (kind === 'EDUCATION') {
      items.push(this.educationItem());
    } else {
      items.push(this.contactLink());
    }
    this.emitNow();
  }

  removeItem(kind: 'EXPERIENCE' | 'EDUCATION' | 'CONTACT', index: number): void {
    const items = this.form().get(kind === 'CONTACT' ? 'socialLinks' : 'items') as FormArray;
    items.removeAt(index);
    this.emitNow();
  }

  experienceItems(): FormArray {
    return this.form().get('items') as FormArray;
  }

  educationItems(): FormArray {
    return this.form().get('items') as FormArray;
  }

  contactLinks(): FormArray {
    return this.form().get('socialLinks') as FormArray;
  }

  private emitNow(): void {
    this.emit(this.form(), this.block().type);
  }

  private emit(form: FormGroup, type: string): void {
    this.settingsChange.emit(JSON.stringify(this.serialize(form.getRawValue(), type)));
  }

  private serialize(raw: Record<string, unknown>, type: string): unknown {
    switch (type) {
      case 'SKILLS': {
        const text = String(raw['itemsText'] ?? '');
        const items = text
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        return { title: String(raw['title'] ?? ''), items } satisfies SkillsSettings;
      }
      case 'PROJECTS':
        return {
          title: String(raw['title'] ?? ''),
          limit: Number(raw['limit']) || 6,
        } satisfies ProjectsSettings;
      default:
        return raw;
    }
  }

  private parse(block: Block): unknown {
    try {
      return JSON.parse(block.settings) as unknown;
    } catch {
      return {};
    }
  }
}
