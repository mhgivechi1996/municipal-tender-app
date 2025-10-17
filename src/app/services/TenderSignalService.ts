import { Injectable, computed, signal } from '@angular/core';
import { TenderCounts } from '../models/TenderCounts';

@Injectable({ providedIn: 'root' })
export class TenderSignalService {
  private readonly channel =
    typeof window !== 'undefined' && 'BroadcastChannel' in window
      ? new BroadcastChannel('tender-events')
      : null;

  private readonly _version = signal(0);
  private readonly _latestTitle = signal<string | null>(null);
  private readonly _counts = signal<TenderCounts>({ total: 0, open: 0, expired: 0 });

  readonly version = computed(() => this._version());
  readonly latestTitle = computed(() => this._latestTitle());
  readonly counts = computed(() => this._counts());

  constructor() {
    if (this.channel) {
      this.channel.addEventListener('message', (event) => {
        const data = event.data as TenderEventMessage | undefined;
        if (!data) {
          return;
        }

        switch (data.type) {
          case 'tender-created':
            this.applyTenderCreated(data.title ?? null, false);
            break;
          case 'tender-counts':
            this.applyTenderCounts(data.counts, false);
            break;
        }
      });
    }
  }

  notifyTenderCreated(title: string | null): void {
    this.applyTenderCreated(title, true);
  }

  updateCounts(counts: TenderCounts): void {
    const normalized: TenderCounts = {
      total: Math.max(0, counts.total),
      open: Math.max(0, counts.open),
      expired: Math.max(0, counts.expired)
    };
    this.applyTenderCounts(normalized, true);
  }

  private applyTenderCreated(title: string | null, broadcast: boolean): void {
    const normalizedTitle = title ?? null;
    this._latestTitle.set(normalizedTitle);
    this._version.update((value) => value + 1);

    if (broadcast && this.channel) {
      const message: TenderEventMessage = {
        type: 'tender-created',
        title: normalizedTitle
      };
      this.channel.postMessage(message);
    }
  }

  private applyTenderCounts(counts: TenderCounts, broadcast: boolean): void {
    this._counts.set({
      total: counts.total,
      open: counts.open,
      expired: counts.expired
    });

    if (broadcast && this.channel) {
      const message: TenderEventMessage = {
        type: 'tender-counts',
        counts
      };
      this.channel.postMessage(message);
    }
  }
}

type TenderEventMessage = TenderCreatedMessage | TenderCountsMessage;

interface TenderCreatedMessage {
  type: 'tender-created';
  title: string | null;
}

interface TenderCountsMessage {
  type: 'tender-counts';
  counts: TenderCounts;
}
