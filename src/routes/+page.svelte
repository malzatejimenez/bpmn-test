<div class="container">
	<h1>Welcome to SvelteKit</h1>
	<p>
		Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation
	</p>

	<div class="demo-links">
		<h2>BPMN Tools</h2>
		<ul>
			<li>
				<a href="/bpmn">📊 BPMN Visualizer</a> - Interactive BPMN 2.0 diagram viewer with example flows
			</li>
			<li>
				<a href="/bpmn/crear">🏗️ Flow Builder</a> - Create and test your own BPMN flows with live preview
			</li>
		</ul>
	</div>

	<div class="resources">
		<h2>📚 Resources</h2>
		<ul>
			<li>
				<a href="/GUIA_CONSTRUCCION_FLUJOS.md" target="_blank">Complete Flow Construction Guide</a>
			</li>
			<li>
				<a href="/BPMN_README.md" target="_blank">BPMN Visualizer Documentation</a>
			</li>
		</ul>
	</div>
</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}

	h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin-top: 2rem;
		margin-bottom: 1rem;
	}

	.demo-links ul {
		list-style: none;
		padding: 0;
	}

	.demo-links li {
		margin-bottom: 1rem;
		padding: 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: white;
		transition: all 0.2s;
	}

	.demo-links li:hover {
		border-color: #3b82f6;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.demo-links a {
		font-weight: 600;
		color: #3b82f6;
		text-decoration: none;
	}

	.demo-links a:hover {
		text-decoration: underline;
	}

	.resources {
		margin-top: 2rem;
	}

	.resources ul {
		list-style: none;
		padding: 0;
	}

	.resources li {
		margin-bottom: 0.5rem;
	}

	.resources a {
		color: #059669;
		text-decoration: none;
	}

	.resources a:hover {
		text-decoration: underline;
	}
</style>
