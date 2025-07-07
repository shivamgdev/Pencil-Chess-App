import {
  Component,
  AfterViewInit,
  OnDestroy
} from '@angular/core';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.css'],
  standalone: true
})
export class MainPageComponent implements AfterViewInit, OnDestroy {
  iframe1!: HTMLIFrameElement;
  iframe2!: HTMLIFrameElement;

  // Reference to the message event handler for removal on destroy
  private messageHandler = (event: MessageEvent) => {
    if (event.data?.type === 'chess-move') {
      const source = event.source;
      // Determine which iframe sent the message and forward to the other
      const targetIframe =
        source === this.iframe1.contentWindow ? this.iframe2 : this.iframe1;
      targetIframe?.contentWindow?.postMessage(event.data, '*');
    }
  };

  /**
   * After the view initializes, get references to the iframes and
   * set up a message event listener to relay chess moves between them.
   */
  ngAfterViewInit(): void {
    this.iframe1 = document.getElementById('iframe1') as HTMLIFrameElement;
    this.iframe2 = document.getElementById('iframe2') as HTMLIFrameElement;

    window.addEventListener('message', this.messageHandler);
  }

  /**
   * Remove the message event listener when the component is destroyed
   * to prevent memory leaks.
   */
  ngOnDestroy(): void {
    window.removeEventListener('message', this.messageHandler);
  }

  /**
   * Resets the chess game by clearing the saved state and reloading the page.
   */
  resetGame(): void {
    if (confirm('Are you sure you want to reset the game?')) {
      localStorage.removeItem('chess-state');
      window.location.reload();
    }
  }
}