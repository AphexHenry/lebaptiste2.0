import './style.css';

async function bootstrap() {
  const { Book } = await import('./book/Book');
  const canvas = document.getElementById('book-canvas') as HTMLCanvasElement;
  if (!canvas) throw new Error('Canvas element not found');

  const book = new Book(canvas);
  book.start();
}

bootstrap();
