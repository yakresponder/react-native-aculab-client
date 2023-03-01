class Counter {
  private interval: any;
  private _timer: number;

  constructor() {
    this._timer = 0;
  }
  /**
   * starts counter, add 1 to timer state every second.
   */
  startCounter() {
    this.interval = setInterval(() => this._timer++, 1000);
  }

  /**
   * stop counter triggered by startCounter function
   * @returns timer value
   */
  stopCounter() {
    clearInterval(this.interval);
    return this._timer;
  }

  /**
   * reset counter (timer state) to 0
   */
  resetCounter() {
    this._timer = 0;
  }
}

export default new Counter();
