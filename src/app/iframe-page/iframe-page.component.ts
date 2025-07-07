import { CommonModule } from '@angular/common';
import { Component, ViewChild, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxChessBoardComponent, NgxChessBoardModule } from 'ngx-chess-board';

@Component({
  selector: 'app-iframe-page',
  templateUrl: './iframe-page.component.html',
  styleUrls: ['./iframe-page.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  imports: [CommonModule, NgxChessBoardModule]
})
export class IframePageComponent implements AfterViewInit {
  @ViewChild('board') board!: NgxChessBoardComponent;

  // Player's orientation, determined by query param
  orientation: 'white' | 'black' = 'white';

  // Indicates if it's the current player's turn
  isMyTurn = false;

  constructor(private route: ActivatedRoute) { }

  ngAfterViewInit(): void {
    // Get player orientation from query params
    const player = this.route.snapshot.queryParamMap.get('player');
    this.orientation = player === 'black' ? 'black' : 'white';

    // Restore board state from localStorage if available
    const savedFen = localStorage.getItem('chess-state');
    if (savedFen) {
      this.board.setFEN(savedFen);
    }

    this.updateTurnControl();

    // Listen for chess moves from parent window
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'chess-move') {
        this.board.move(event.data.move);
        this.board.setFEN(event.data.fen);
        localStorage.setItem('chess-state', event.data.fen);
        this.updateTurnControl();

        if (this.detectCheckmate(event.data.fen)) {
          alert(`Checkmate! Winner: ${this.orientation === 'white' ? 'Black' : 'White'}`);
          this.isMyTurn = false;
        }
      }
    });
  }

  /**
   * Handles move events from the chess board.
   * Saves the new FEN, notifies the parent, and checks for checkmate.
   */
  onMove(event: any): void {
    const currentFEN = event.fen;

    // Save current board state
    localStorage.setItem('chess-state', currentFEN);

    // Notify parent window of the move
    parent.postMessage({
      type: 'chess-move',
      move: event.move?.san,
      fen: currentFEN
    }, '*');

    this.updateTurnControl();

    if (this.detectCheckmate(currentFEN)) {
      alert(`Checkmate! Winner: ${this.orientation}`);
      this.isMyTurn = false;
    }
  }

  /**
   * Updates the isMyTurn flag based on the board's FEN and player orientation.
   */
  private updateTurnControl(): void {
    const fen = this.board.getFEN();
    const turn = fen.split(' ')[1]; // 'w' or 'b'
    const isWhiteTurn = turn === 'w';
    this.isMyTurn = (this.orientation === 'white' && isWhiteTurn) ||
      (this.orientation === 'black' && !isWhiteTurn);
  }

  /**
   * Naive checkmate detection: returns true if either king is missing.
   * Note: This does not cover all chess rules for checkmate/stalemate.
   */
  private detectCheckmate(fen: string): boolean {
    const [position] = fen.split(' ');
    const boardRows = position.split('/');
    let hasWhiteKing = false;
    let hasBlackKing = false;

    for (const row of boardRows) {
      for (const char of row) {
        if (char === 'K') hasWhiteKing = true;
        if (char === 'k') hasBlackKing = true;
      }
    }

    // If a king is missing, it's checkmate
    return !hasWhiteKing || !hasBlackKing;
  }
}