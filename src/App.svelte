<script>
	let name = 'Anand Raja';
  let age = 27;

  $: upperCaseName = name.toUpperCase(); // svelte will always update whenever variable 'name' changes

  $: console.log(name);

  $: if(name.toLowerCase() === 'ar') {
      age = 29;
    } else {
      age = 27;
    }

  function increaseAge() {
    age +=1;
  }

  // function changeName() {
  //   name = 'ar'
  // }

  // function inputNameChange(event) {
  //   name = event.target.value.trim();
  // }
</script>

<style>
	h1 {
		color: purple;
	}
</style>

<h1>Hello {upperCaseName}!</h1>
<h2>Your age is {age}</h2>
<button on:click="{increaseAge}">Increase Age</button>
<!-- <button on:click="{changeName}">Change Name</button> -->
<!-- <input type="text" value="{name}" on:input="{inputNameChange}"> -->
<input type="text" bind:value="{name}">
