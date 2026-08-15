/** A course grade, canonically stored as a decimal (0.1 == 10% == a 10m
 * rise per 100m of horizontal distance). */
export class Grade {
  private constructor(readonly decimal: number) {}

  static readonly flat = new Grade(0);

  static fromRiseAndRun(riseM: number, runM: number): Grade {
    if (runM <= 0) return Grade.flat;
    return new Grade(riseM / runM);
  }

  get percent(): number {
    return this.decimal * 100;
  }
}
