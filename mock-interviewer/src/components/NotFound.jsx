import Button from './ui/Button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">404</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">That page is not in this workspace.</h1>
        <p className="mt-3 text-gray-600">Return to the opportunity tracker or the home page to keep working.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button to="/applications">Open tracker</Button>
          <Button variant="outline" to="/">Home</Button>
        </div>
      </div>
    </main>
  );
}
