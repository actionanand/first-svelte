<script>
  import ContactCard from './ContactCard.svelte';
  import LifecycleHooks from './LifecycleHooks.svelte'

  export let appName;

  let name = 'Mr. X';
  let title = 'Self own job';
  let image = 'https://api.lorem.space/image/face?w=150&h=150';
  let description = "";
  let formState = 'empty';
  let createdContacts = [];
  let isFirstElDeleted = false;
  let isLifeCycleOpen = false;

  $: if(isLifeCycleOpen) {
    setTimeout(() => {
      isLifeCycleOpen = false;
    }, 20000);
  }

  // $: upperCaseName = name.toUpperCase(); // svelte will always update whenever variable 'name' changes

  // $: console.log(name);

  function addContact() {
    if(name.trim() === '', title.trim() === '', image.trim() === '', description.trim() === '') {
      formState = 'invalid';
      return;
    }
    formState = 'done'; 
    createdContacts = [
      ...createdContacts,
      {
        id: Math.random(),
        name,
        title,
        imageUrl: image,
        desc: description
      }]; 
  }

  function deleteFirstEl() {
    createdContacts = createdContacts.slice(1);
    isFirstElDeleted = true;
  }

  function deleteLastEl() {
    createdContacts = createdContacts.slice(0, -1);
  }
</script>

<style>
  #form {
    width: 30rem;
    max-width: 100%;
  }
  
  .note-style {
    color: red;
    font-weight: bold;
  }

  .capitalize-it {
    text-transform: capitalize;
  }
</style>

<h1 class="capitalize-it">{appName}</h1>
<div id="form">
  <div class="form-control">
    <label for="userName">User Name</label>
    <input type="text" bind:value={name} id="userName" placeholder="Add your name"/>
  </div>
  <div class="form-control">
    <label for="jobTitle">Job Title</label>
    <input type="text" bind:value={title} id="jobTitle" placeholder="Add your job title" />
  </div>
  <div class="form-control">
    <label for="image">Image URL</label>
    <input type="url" bind:value={image} id="image" placeholder="Add your image url" />
  </div>
  <div class="form-control">
    <label for="desc">Description</label>
    <textarea rows="3" bind:value={description} id="desc" placeholder="Add some description."/>
  </div>
</div>

<button on:click="{addContact}">Add Contact</button>
<button on:click|once="{deleteFirstEl}">Delete First</button>
<button on:click="{deleteLastEl}">
  Delete Last
</button>
<button on:click="{() => isLifeCycleOpen = !isLifeCycleOpen}">
  {isLifeCycleOpen? 'Hide ' : 'Show '} Lifecycle Hooks
</button>

{#if isFirstElDeleted}
  <p><span class="note-style">Delete First</span> button won't work!</p>
{/if}

{#if formState === 'invalid'}
  <p>Invalid Inputs</p>
{:else}
  <p>Please fill the form.</p>
{/if}

{#each createdContacts as contact, index (contact.id)}
  <h2># {index + 1}</h2>
  <ContactCard 
    userName={contact.name} 
    jobTitle={contact.title} 
    description={contact.desc} 
    userImage={contact.imageUrl} 
  />
{:else}
  <p>Please add some contacts. We found none!</p>
{/each}

<!-- Life cycle hooks -->

{#if isLifeCycleOpen}
  <LifecycleHooks/>
{/if}
<br>