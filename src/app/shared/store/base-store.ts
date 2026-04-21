import { signal, computed, Signal } from '@angular/core';

// ============================================================
// BASE SIGNAL STORE — Reusable Generic Store
// BONUS TASK: Small reusable signal-based store
//
// Kya hai yeh?
//   Ek generic class jo kisi bhi data type ke liye
//   signal-based state management provide karti hai.
//   Isse inherit karke specific stores bana sakte ho.
//
// Benefits:
//   - Har jagah same pattern — consistent codebase
//   - Type-safe (TypeScript generics)
//   - Built-in loading, error states
//   - No boilerplate for each feature
//
// Usage example:
//   class VehicleStore extends BaseStore<Vehicle> {
//     readonly parked = computed(() =>
//       this.items().filter(v => v.status === 'parked')
//     );
//   }
// ============================================================

export class BaseStore<T extends { id: string }> {

  // ── Core State Signals ───────────────────────────────────
  readonly items = signal<T[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // ── Derived Computed Signals ─────────────────────────────
  readonly count = computed(() => this.items().length);
  readonly isEmpty = computed(() => this.items().length === 0);
  readonly hasError = computed(() => this.error() !== null);

  // ── CRUD Operations ──────────────────────────────────────

  /**
   * Sab items set karo (initial load ya API response)
   */
  setAll(data: T[]): void {
    this.items.set(data);
    this.error.set(null);
  }

  /**
   * Ek item add karo
   */
  add(item: T): void {
    this.items.update(current => [...current, item]);
  }

  /**
   * ID se item update karo
   */
  update(id: string, changes: Partial<T>): void {
    this.items.update(current =>
      current.map(item =>
        item.id === id ? { ...item, ...changes } : item
      )
    );
  }

  /**
   * ID se item remove karo
   */
  remove(id: string): void {
    this.items.update(current =>
      current.filter(item => item.id !== id)
    );
  }

  /**
   * ID se item dhundo
   */
  findById(id: string): T | undefined {
    return this.items().find(item => item.id === id);
  }

  /**
   * Custom filter — predicate function pass karo
   */
  filter(predicate: (item: T) => boolean): T[] {
    return this.items().filter(predicate);
  }

  // ── Loading / Error State ────────────────────────────────

  /**
   * Async operation ke liye (future API calls)
   * Usage:
   *   this.store.startLoading();
   *   this.http.get(...).subscribe({
   *     next: data => this.store.setAll(data),
   *     error: err => this.store.setError(err.message),
   *     complete: () => this.store.stopLoading()
   *   });
   */
  startLoading(): void { this.loading.set(true); this.error.set(null); }
  stopLoading(): void { this.loading.set(false); }
  setError(msg: string): void {
    this.error.set(msg);
    this.loading.set(false);
  }

  /**
   * Store reset karo
   */
  reset(): void {
    this.items.set([]);
    this.loading.set(false);
    this.error.set(null);
  }
}
