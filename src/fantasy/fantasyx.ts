import { HKTS } from '../xs'
import { PlanX } from './planx'
import { PlanS } from './interfaces'
import { x } from '../x'
import { Actions, XcomponentClass } from '../interfaces'
export class FantasyX<E extends HKTS, I, S> {
  plan: PlanX<E, I, S>
  constructor(plan: PlanS<E, I, S>) {
    this.plan = new PlanX(plan)
  }
  apply(WrappedComponent) {
    return x(this.plan.toPlan())(WrappedComponent)
  }
  map(f: (s: Partial<S>) => Partial<S>): FantasyX<E, I, S> {
    return new FantasyX(this.plan.map(f).apply)
  }

  bimap(
    fa: (a: Partial<S>) => Partial<S>, fb: (b?: Actions<I>) => Actions<I>
  ): FantasyX<E, I, S> {
    return new FantasyX(this.plan.bimap(fa, fb).apply)
  }
}
