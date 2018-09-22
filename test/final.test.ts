import { Machine } from '../src/index';
import { assert } from 'chai';
import { done } from '../src/actions';

// @ts-ignore
const finalMachine = Machine({
  id: 'final',
  initial: 'green',
  states: {
    green: {
      on: {
        TIMER: 'yellow'
      }
    },
    yellow: { on: { TIMER: 'red' } },
    red: {
      type: 'parallel',
      states: {
        crosswalk1: {
          initial: 'walk',
          states: {
            walk: {
              on: { PED_WAIT: 'wait' }
            },
            wait: {
              on: { PED_STOP: 'stop' }
            },
            stop: {
              type: 'final'
            }
          },
          onDone: {
            actions: 'syncFirstCrosswalk'
          }
        },
        crosswalk2: {
          initial: 'walk',
          states: {
            walk: {
              on: { PED_WAIT: 'wait' }
            },
            wait: {
              on: { PED_STOP: 'stop' }
            },
            stop: {
              type: 'final'
            }
          },
          on: {
            [done('final.red.crosswalk2')]: {
              actions: 'syncWithOtherCrosswalk'
            }
          }
        }
      },
      on: {
        [done('final.red.crosswalk1.stop')]: {
          actions: 'stopCrosswalk1'
        },
        [done('final.red.crosswalk2.stop')]: {
          actions: 'stopCrosswalk2'
        },
        [done('final.red')]: {
          actions: 'prepareGreenLight'
        }
      }
    }
  },
  onDone: {
    // this action should never occur because final states are not direct children of machine
    actions: 'shouldNeverOccur'
  }
});

describe('final states', () => {
  it('should emit the "done.state.final.red" event when all nested states are finalized', () => {
    const redState = finalMachine.transition('yellow', 'TIMER');
    const waitState = finalMachine.transition(redState, 'PED_WAIT');
    const stopState = finalMachine.transition(waitState, 'PED_STOP');

    assert.sameDeepMembers(stopState.actions, [
      { type: 'stopCrosswalk1', exec: undefined },
      { type: 'stopCrosswalk2', exec: undefined },
      { type: 'prepareGreenLight', exec: undefined },
      { type: 'syncFirstCrosswalk', exec: undefined },
      { type: 'syncWithOtherCrosswalk', exec: undefined }
    ]);

    const greenState = finalMachine.transition(stopState, 'TIMER');
    assert.isEmpty(greenState.actions);
  });
});
