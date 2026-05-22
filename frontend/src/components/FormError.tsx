interface FormErrorProps {
  message: string;
  className?: string;
}

export default function FormError({ message, className = '' }: FormErrorProps) {
  return (
    <p className={`text-sm text-red-600 ${className}`}>
      {message}
    </p>
  );
}
