<script>
  import ContactCard from "./ContactCard.svelte";

  let name = "Anand";
  let title = "";
  let image = "";
  let description = "";
  let formState = 'empty';

  function addContact() {
    if(name.trim() === '', title.trim() === '', image.trim() === '', description.trim() === '') {
      formState = 'invalid';
      return;
    }
    formState = 'done'; 
  }
</script>

<style>
  #form {
    width: 30rem;
    max-width: 100%;
  }
</style>

<div id="form">
  <div class="form-control">
    <label for="userName">User Name</label>
    <input type="text" bind:value={name} id="userName" />
  </div>
  <div class="form-control">
    <label for="jobTitle">Job Title</label>
    <input type="text" bind:value={title} id="jobTitle" />
  </div>
  <div class="form-control">
    <label for="image">Image URL</label>
    <input type="url" bind:value={image} id="image" />
  </div>
  <div class="form-control">
    <label for="desc">Description</label>
    <textarea rows="3" bind:value={description} id="desc" />
  </div>
</div>

<button on:click="{addContact}">Add Contact</button>
{#if formState === 'done'}
  <ContactCard userName={name} jobTitle={title} {description} userImage={image} />
{:else if formState === 'invalid'}
  <p>Invalid Inputs</p>
{:else}
  <p>Please fill the form.</p>
{/if}