import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { Project } from '../../shared/models/project.model';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;

  const project = (visible: boolean): Project => ({
    id: 7,
    title: 'Mi app',
    description: null,
    repositoryUrl: 'https://github.com/x/y',
    liveDemoUrl: null,
    imageUrl: null,
    createdAt: '2026-01-01T00:00:00Z',
    technologies: [{ id: 1, name: 'Angular', iconUrl: null }],
    visible,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('toggleVisibility envía visible invertido conservando los datos actuales', () => {
    let result: Project | undefined;
    service.toggleVisibility(project(true)).subscribe((p) => (result = p));

    const put = httpMock.expectOne(`${environment.apiUrl}/portfolio/projects/7`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.visible).toBe(false);
    expect(put.request.body.title).toBe('Mi app');
    expect(put.request.body.technologyIds).toEqual([1]);
    expect(put.request.body.repositoryUrl).toBe('https://github.com/x/y');

    put.flush(project(false));
    expect(result?.visible).toBe(false);

    // update recarga la lista tras guardar (tap -> reload).
    const reload = httpMock.expectOne(
      (req) => req.method === 'GET' && req.url.includes('/portfolio/projects'),
    );
    reload.flush({
      content: [project(false)],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
    });
    expect(service.projects()).toEqual([project(false)]);
  });

  it('toggleVisibility publica un proyecto oculto', () => {
    service.toggleVisibility(project(false)).subscribe();

    const put = httpMock.expectOne(`${environment.apiUrl}/portfolio/projects/7`);
    expect(put.request.body.visible).toBe(true);
    put.flush(project(true));
    httpMock
      .expectOne((req) => req.method === 'GET' && req.url.includes('/portfolio/projects'))
      .flush({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 });
  });
});
