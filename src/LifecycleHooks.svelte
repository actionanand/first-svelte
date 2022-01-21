<script>
  import { onMount, onDestroy, beforeUpdate, afterUpdate } from 'svelte';

  let joke = { type: 'loading', value: { joke: "" } };
  let date = new Date();

  onMount(async () => {
    const randomNum = rnd(300);
    console.log('Component Mounted.')
    const jokeUrl = `https://api.icndb.com/jokes/${randomNum}`;
    const res = await fetch(jokeUrl); // Chuck Norris API to get a joke
    joke = await res.json();
  });

  // onMount(
  //   fetch("https://jsonplaceholder.typicode.com/todos/1")
  //     .then(response => response.json())
  //     .then(todo => {
  //       mytodo = todo;
  //     })
  // );

  onDestroy(() => {
    console.log('Component Unmounted.')
    clearInterval(timer);
  });

  beforeUpdate(() => console.log('"beforeUpdate" will appear just before "the date" get increased.'));

  afterUpdate(function() {
    console.log('"afterUpdate" will appear just after "the date" get increased.');
  });

  let timer = setInterval(() => {
    date = new Date();
  }, 1000);

  function rnd(max) {
    return Math.floor(Math.random() * max) + 14; // min. number will be 13
  }
</script>

<div class="lifecycle-card">
  <p>Component will be un-mounted in 20s.</p>
  <p>Current Time: <span class="date-span">{date.toLocaleTimeString()}</span></p>
  {#if joke.type === 'loading'}
    <p>Loading...</p>
  {:else if joke.type === 'NoSuchQuoteException'}
    <p>Sorry, {joke.value} Please try again with different ID</p>
  {:else}
    <p>{joke.value.joke}</p>
  {/if}
</div>

<style>
  .lifecycle-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.26);
    max-width: 30rem;
    border-radius: 5px;
    margin: 1rem 0;
    background: white;
    padding: 1rem;
  }

  .date-span {
    color: green;
    font-weight: bold;
  }
</style>