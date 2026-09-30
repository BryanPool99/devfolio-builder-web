import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PublicPortfolioService } from '../../core/services/public-portfolio.service';
import { BlockRendererComponent } from '../../shared/components/block-renderer/block-renderer';

/**
 * Vista publica del portafolio en /u/:username: sin guard, con toolbar y
 * footer propios (el shell vive detras de authGuard).
 */
@Component({
  selector: 'app-public-portfolio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    BlockRendererComponent,
  ],
  templateUrl: './public-portfolio.html',
  styleUrl: './public-portfolio.scss',
})
export class PublicPortfolioComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly portfolioService = inject(PublicPortfolioService);

  private username = '';

  ngOnInit(): void {
    // paramMap reacciona si se navega de un /u/a a /u/b sin salir de la ruta.
    this.route.paramMap.subscribe((params) => {
      this.username = params.get('username') ?? '';
      this.portfolioService.load(this.username);
    });
  }

  onPage(event: PageEvent): void {
    this.portfolioService.load(this.username, event.pageIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  retry(): void {
    this.portfolioService.load(this.username);
  }
}
