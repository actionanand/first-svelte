<script>
  import ContactCard from './ContactCard.svelte';

	let name = 'Anand Raja';
  let title = '';
  let image = '';
  let description = '';
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
<input type="text" bind:value="{name}" placeholder="name">
<input type="text" bind:value="{title}" placeholder="job title">
<input type="text" bind:value="{image}" placeholder="image url">
<textarea rows="3" bind:value="{description}" placeholder="Please enter the description"></textarea>
<ContactCard userName="{name}" jobTitle="{title}" {description} userImage="{image}" />
