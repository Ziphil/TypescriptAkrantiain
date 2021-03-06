//

import {
  AkrantiainError,
  Module,
  Stat
} from ".";
import {
  Matchable
} from "./matchable";


export class Identifier extends Matchable {

  public readonly text: string;

  public constructor(text: string) {
    super();
    this.text = text;
  }

  public matchRight(stat: Stat, from: number, module: Module): number {
    let content = module.findContent(this);
    if (content !== undefined) {
      let to = content.matchRight(stat, from, module);
      return to;
    } else {
      throw new AkrantiainError(9000, -1, "Cannot happen (at Identifier#matchRight)");
    }
  }

  public matchLeft(stat: Stat, to: number, module: Module): number {
    let content = module.findContent(this);
    if (content !== undefined) {
      let from = content.matchLeft(stat, to, module);
      return from;
    } else {
      throw new AkrantiainError(9001, -1, "Cannot happen (at Identifier#matchLeft)");
    }
  }

  public isConcrete(): boolean {
    return true;
  }

  public findUnknownIdentifier(module: Module): Identifier | undefined {
    if (!module.hasDefinition(this)) {
      return this;
    } else {
      return undefined;
    }
  }

  public findCircularIdentifier(identifiers: Array<Identifier>, module: Module): Identifier | undefined {
    let identifier = identifiers.find((identifier) => identifier.equals(this));
    if (identifier !== undefined) {
      return identifier;
    } else {
      let definition = module.findDefinition(this);
      if (definition !== undefined) {
        return definition.findCircularIdentifier(identifiers, module);
      } else {
        return undefined;
      }
    }
  }

  public equals(that: Identifier): boolean {
    return this.text === that.text;
  }

  public toString(): string {
    return this.text;
  }

}