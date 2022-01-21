<script>
	let name = 'Anand Raja';
  let age = 27;

  function increaseAge() {
    age +=1;
  }
</script>

<style>
	h1 {
		color: purple;
	}
</style>

<h1>Hello {name}!</h1>
<h2>Your age is {age}</h2>
<button on:click="{increaseAge}">Increase Age</button>
