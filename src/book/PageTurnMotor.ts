import { TURN_ANGLE } from '../types/book';
import type { BookPage } from './BookPage';

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

interface ActiveTurn {
  page: BookPage;
  fromAngle: number;
  toAngle: number;
  fromZ: number;
  toZ: number;
  fromCurl: number;
  toCurl: number;
  duration: number;
  elapsed: number;
  resolve: () => void;
}

const TURN_LIFT = 0.15;
const CURL_AMOUNT = 0.05;
const DEFAULT_DURATION = 0.9;

export class PageTurnMotor {
  private activeTurns: ActiveTurn[] = [];
  private readonly instant: boolean;

  constructor(instant = false) {
    this.instant = instant;
  }

  get isAnimating(): boolean {
    return this.activeTurns.length > 0;
  }

  update(delta: number): void {
    for (let i = this.activeTurns.length - 1; i >= 0; i--) {
      const turn = this.activeTurns[i];
      turn.elapsed += delta;
      const t = Math.min(turn.elapsed / turn.duration, 1);
      const eased = easeInOutCubic(t);

      const angle = turn.fromAngle + (turn.toAngle - turn.fromAngle) * eased;
      const z = turn.fromZ + (turn.toZ - turn.fromZ) * eased;
      const curl = turn.fromCurl + (turn.toCurl - turn.fromCurl) * eased;

      turn.page.setAngle(angle);
      turn.page.setTurnLift(z);
      turn.page.group.rotation.x = curl;

      if (t >= 1) {
        turn.page.markTurned(turn.toAngle <= TURN_ANGLE + 0.01);
        if (turn.toAngle === 0) {
          turn.page.group.rotation.x = 0;
        }
        turn.resolve();
        this.activeTurns.splice(i, 1);
      }
    }
  }

  turn(page: BookPage, targetAngle: number, duration = DEFAULT_DURATION): Promise<void> {
    if (Math.abs(page.currentAngle - targetAngle) < 0.001) {
      page.markTurned(targetAngle <= TURN_ANGLE + 0.01);
      return Promise.resolve();
    }

    const baseZ = page.baseZ;
    const isTurning = targetAngle < 0;
    const targetZ = isTurning ? baseZ + TURN_LIFT : baseZ;
    const targetCurl = isTurning ? CURL_AMOUNT : 0;

    if (this.instant) {
      page.setAngle(targetAngle);
      page.setTurnLift(targetZ);
      page.group.rotation.x = targetCurl;
      page.markTurned(targetAngle <= TURN_ANGLE + 0.01);
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.activeTurns.push({
        page,
        fromAngle: page.currentAngle,
        toAngle: targetAngle,
        fromZ: page.group.position.z,
        toZ: targetZ,
        fromCurl: page.group.rotation.x,
        toCurl: targetCurl,
        duration,
        elapsed: 0,
        resolve,
      });
    });
  }

  async turnToIndex(pages: BookPage[], targetIndex: number): Promise<void> {
    for (let i = 0; i < targetIndex; i++) {
      if (!pages[i].isTurned) {
        await this.turn(pages[i], TURN_ANGLE);
      }
    }
  }
}
