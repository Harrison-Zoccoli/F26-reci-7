# Reflection

**Name / Andrew ID:** Harrison Zoccoli / hzoccoli

**Recitation group members (Task 2):** Finished the problem set on my own from the recitation starter. I didn't write down the group names.

---

### 1. Valid but weak

Pick a property you wrote that passes on the correct implementation but
kills few or no mutants. Why is it still a *valid* property? Describe a
concrete bug (not one of our mutants) that it *would* catch.

"returns exactly five colors" passes on the correct `matchGuess` and killed none of the public mutants. Every mutant still returns an array of length 5, so the check never fails. It is still valid: the spec says the result is five colors, one per position of the guess. It would catch a bug that returned only the non-black colors, or stopped after the first green and returned a shorter array.

### 2. A generator problem, not a property problem

Describe a mutant, from either task, that survived or was flaky because of
your **generator** rather than your property. What did the generator fail to
produce? How did you fix it? Paste the runner output from before and after.

`singlePass` was flaky with the recitation generator (any letter A–Z). The property already said a letter cannot be credited more times than the secret contains it. The bug is an early yellow using up a letter that a later green still needs, which only happens when a letter is repeated. Five letters chosen from 26 are usually all different, so most runs never built that input.

Before, with `wordFrom('ABCDEFGHIJKLMNOPQRSTUVWXYZ')`:

```
  ~ singlePass     flaky: killed in 3/5 runs  by: never credits a letter more times than the secret contains it
      Counterexample: ["AAAAU","AUAAU"]
      AssertionError: expected 2 to be less than or equal to 1
```

I kept the full alphabet, but also generate from `ABC`, so repeats are common. A tiny alphabet alone would hide the other kind of bug: a guess letter that is missing from the secret. After:

```
  ✔ singlePass     killed  by: never credits a letter more times than the secret contains it; credits each letter as many times as the counts allow
      Counterexample: ["CCAAA","AAAAA"]
      AssertionError: expected 5 to be less than or equal to 3
```

### 3. Reading a counterexample

Paste one counterexample that the mutation runner printed for a killed
mutant. In 2–3 sentences, explain using the *specification* why that input
exposes the bug.

```
  ✔ ignoresCounts  killed  by: never credits a letter more times than the secret contains it; credits each letter as many times as the counts allow
      Counterexample: ["AAAAB","AAAAA"]
      AssertionError: expected 5 to be less than or equal to 4
```

The secret `AAAAB` has four A's. The guess `AAAAA` matches the first four, so those are green and all four A's are used. The last A is not a positional match and there is no A left, so the spec says it is black. The bug marks it yellow just because A appears somewhere in the secret, and the guess is credited with five A's.

### 4. Your project

Name one function or module in your team's project that would benefit from
property-based testing. State two properties in English, name the pattern of
each, and describe the generator you'd need, including anything about its
inputs that a naive generator would get wrong.

In our OpenCode project (sashimi), `truncate` in `packages/tui/src/util/locale.ts` shortens a string to a length without cutting an emoji in half. Example tests with a few ASCII strings would miss that.

- Invariant: the result is never longer than the limit, and if the input was shortened the result ends with `…` and the part before that is a prefix of the input.
- Algebraic: truncating the result again to the same limit changes nothing. `truncate(truncate(s, n), n)` equals `truncate(s, n)`.

The generator needs strings of graphemes, including emoji and accented characters, and a limit of at least 1. A naive generator of random UTF-16 units would split a surrogate pair, so the input itself would already be a broken string and the property would be arguing about garbage.
