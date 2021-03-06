//

import {
  Identifier,
  Module,
  Stat
} from ".";
import {
  Matchable
} from "./matchable";


export class Disjunction extends Matchable {

  private readonly matchables: ReadonlyArray<Matchable>;
  private readonly negated: boolean;

  public constructor(matchables: Array<Matchable>, negated: boolean = false) {
    super();
    this.matchables = matchables;
    this.negated = negated;
  }

  public matchRight(stat: Stat, from: number, module: Module): number {
    let to = (() => {
      if (this.matchables.length > 0) {
        for (let matchable of this.matchables.slice().reverse()) {
          let to = matchable.matchRight(stat, from, module);
          if (to >= 0) {
            return to;
          }
        }
        return -1;
      } else {
        return -1;
      }
    })();
    if (this.negated) {
      return (to === -1) ? from : -1;
    } else {
      return to;
    }
  }

  public matchLeft(stat: Stat, to: number, module: Module): number {
    let from = (() => {
      if (this.matchables.length > 0) {
        for (let matchable of this.matchables.slice().reverse()) {
          let from = matchable.matchLeft(stat, to, module);
          if (from >= 0) {
            return from;
          }
        }
        return -1;
      } else {
        return -1;
      }
    })();
    if (this.negated) {
      return (from === -1) ? to : -1;
    } else {
      return from;
    }
  }

  public isConcrete(): boolean {
    return this.matchables.length >= 2 || (this.matchables.length >= 1 && this.matchables[0].isConcrete());
  }

  public findUnknownIdentifier(module: Module): Identifier | undefined {
    for (let matchable of this.matchables) {
      let identifier = matchable.findUnknownIdentifier(module);
      if (identifier !== undefined) {
        return identifier;
      }
    }
    return undefined;
  }

  public findCircularIdentifier(identifiers: Array<Identifier>, module: Module): Identifier | undefined {
    for (let matchable of this.matchables) {
      let identifier = matchable.findCircularIdentifier(identifiers, module);
      if (identifier !== undefined) {
        return identifier;
      }
    }
    return undefined;
  }

  public toString(): string {
    let string = "";
    if (this.negated) {
      string += "!";
    }
    string += `(${this.matchables.join(" | ")})`;
    return string;
  }

}