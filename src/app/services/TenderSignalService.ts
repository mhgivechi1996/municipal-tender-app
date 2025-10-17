import { Injectable, computed, signal } from '@angular/core';
import { TenderCounts } from '../models/TenderCounts';

@Injectable({ providedIn: 'root' })
export class TenderSignalService {
  private readonly channel =
    typeof window !== 'undefined' && 'BroadcastChannel' in window
      ? new BroadcastChannel('tender-events')
      : null;

  private readonly _counts = signal<TenderCounts>({ total: 0, open: 0, expired: 0 });

  readonly counts = computed(() => this._counts());

  constructor() {
    if (this.channel) {
      this.channel.addEventListener('message', (event) => {
        const data = event.data as TenderCountsMessage | undefined;
        if (!data || data.type !== 'tender-counts') {
          return;
        }

        this.applyTenderCounts(data.counts, false);
      });
    }
  }

  updateCounts(counts: TenderCounts): void {
    const normalized: TenderCounts = {
      total: Math.max(0, counts.total),
      open: Math.max(0, counts.open),
      expired: Math.max(0, counts.expired)
    };
    this.applyTenderCounts(normalized, true);
  }

  private applyTenderCounts(counts: TenderCounts, broadcast: boolean): void {
    this._counts.set({
      total: counts.total,
      open: counts.open,
      expired: counts.expired
    });

    if (broadcast && this.channel) {
      const message: TenderCountsMessage = {
        type: 'tender-counts',
        counts
      };
      this.channel.postMessage(message);
    }
  }
}

interface TenderCountsMessage {
  type: 'tender-counts';
  counts: TenderCounts;
}
