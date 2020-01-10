declare module 'tailwindcss'
declare module 'tailwindcss/lib/util/processPlugins' {
	interface PluginObject {
		base: any[]
		components: any[]
		utilities: any[]
		variantGenerators: object
	}
	function processPlugins(plugins: any[], config: any): PluginObject
	export default processPlugins
}
