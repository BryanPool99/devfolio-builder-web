import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SettingsPanelComponent } from './settings-panel';
import { Block } from '../../../shared/models/portfolio.model';

describe('SettingsPanelComponent', () => {
  let fixture: ComponentFixture<SettingsPanelComponent>;

  const skillsBlock = (id: number, items: string[]): Block => ({
    id,
    type: 'SKILLS',
    position: 0,
    settings: JSON.stringify({ title: 'Habilidades', items }),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SettingsPanelComponent] }).compileComponents();
    fixture = TestBed.createComponent(SettingsPanelComponent);
  });

  it('conserva espacios y saltos de línea al escribir en habilidades', async () => {
    const emitted: string[] = [];
    fixture.componentInstance.settingsChange.subscribe((value) => emitted.push(value));

    fixture.componentRef.setInput('block', skillsBlock(1, ['Angular']));
    fixture.detectChanges();
    await fixture.whenStable();

    const textarea = fixture.nativeElement.querySelector('textarea');
    expect(textarea.value).toBe('Angular');

    textarea.value = 'Angular \n';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(emitted.length).toBe(1);
    // Lo que se persiste sí se recorta (datos limpios)...
    expect(JSON.parse(emitted[0]).items).toEqual(['Angular']);

    // El editor aplica esos settings con el mismo id (referencia nueva):
    // antes, esto reconstruía el form y se comía el espacio y el Enter.
    fixture.componentRef.setInput('block', {
      ...skillsBlock(1, ['Angular']),
      settings: emitted[0],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(textarea.value).toBe('Angular \n');
  });

  it('reconstruye el form al cambiar de bloque seleccionado', async () => {
    fixture.componentRef.setInput('block', skillsBlock(1, ['Angular']));
    fixture.detectChanges();
    await fixture.whenStable();

    const textarea = fixture.nativeElement.querySelector('textarea');
    expect(textarea.value).toBe('Angular');

    fixture.componentRef.setInput('block', skillsBlock(2, ['React']));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(textarea.value).toBe('React');
  });

  it('registra los controles del repeater de formación (formArrayName)', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      fixture.componentRef.setInput('block', {
        id: 10,
        type: 'EDUCATION',
        position: 0,
        settings: JSON.stringify({
          title: 'Formación',
          items: [{ degree: 'Ingeniería', school: 'UNEFA', period: '2020 — 2024' }],
        }),
      });
      fixture.detectChanges();
      await fixture.whenStable();

      // title + degree + school + period
      const inputs = Array.from(
        fixture.nativeElement.querySelectorAll('input'),
      ) as HTMLInputElement[];
      expect(inputs.length).toBe(4);

      inputs[1].value = 'Nuevo grado';
      inputs[1].dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const degree = fixture.componentInstance.educationItems().at(0).get('degree');
      expect(degree?.value).toBe('Nuevo grado');

      const controlErrors = consoleError.mock.calls
        .map((args) => args.map(String).join(' '))
        .filter((msg) => msg.includes('Cannot find control'));
      expect(controlErrors).toEqual([]);
    } finally {
      consoleError.mockRestore();
    }
  });

  it('serializa funciones y tecnologías del repeater de experiencia', async () => {
    const emitted: string[] = [];
    fixture.componentInstance.settingsChange.subscribe((value) => emitted.push(value));

    // Datos antiguos sin los campos nuevos: deben defaultear a listas vacías.
    fixture.componentRef.setInput('block', {
      id: 11,
      type: 'EXPERIENCE',
      position: 0,
      settings: JSON.stringify({
        title: 'Experiencia',
        items: [{ role: 'Dev', company: 'ACME', period: '2024', description: '' }],
      }),
    });
    fixture.detectChanges();
    await fixture.whenStable();

    // description + functionsText + technologiesText
    const textareas = Array.from(
      fixture.nativeElement.querySelectorAll('textarea'),
    ) as HTMLTextAreaElement[];
    expect(textareas.length).toBe(3);
    expect(textareas[1].value).toBe('');
    expect(textareas[2].value).toBe('');

    textareas[1].value = 'Desarrollo de API\nCode reviews';
    textareas[1].dispatchEvent(new Event('input'));
    textareas[2].value = 'Angular\nSpring Boot';
    textareas[2].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const parsed = JSON.parse(emitted[emitted.length - 1]) as {
      items: Array<{
        functions: string[];
        technologies: string[];
        description: string;
      }>;
    };
    expect(parsed.items[0].functions).toEqual(['Desarrollo de API', 'Code reviews']);
    expect(parsed.items[0].technologies).toEqual(['Angular', 'Spring Boot']);
    expect(parsed.items[0].description).toBe('');
  });
});
