import { Disposable } from '@platform/types';
import { Observable, Subject } from 'rxjs';

export const Dispose = {
  /**
   * Creates a generic disposable interface that is typically
   * mixed into a wider interface of some kind.
   */
  create(until$?: Observable<any>): Disposable {
    const dispose$ = new Subject<void>();
    const disposable: Disposable = {
      dispose$: dispose$.asObservable(),
      dispose: () => {
        dispose$.next();
        dispose$.complete();
      },
    };

    if (until$) {
      until$.subscribe(() => disposable.dispose());
    }

    return disposable;
  },

  /**
   * Listens to an observable and disposes of the object when fires.
   */
  until(disposable: Disposable, until$?: Observable<any>): Disposable {
    if (until$) {
      until$.subscribe(() => disposable.dispose());
    }
    return disposable;
  },

  /**
   * "Completes" a subject by running:
   *
   *  1. subject.next();
   *  2. subject.complete();
   *
   */
  done(dispose$?: Subject<void>) {
    dispose$?.next();
    dispose$?.complete();
  },
};
