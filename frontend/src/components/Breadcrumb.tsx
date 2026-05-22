import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav className="flex items-center space-x-0 text-sm" aria-label="Breadcrumb">
            <div className="flex items-center space-x-0">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center">
                        {index > 0 && (
                            <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                        )}
                        {item.href ? (
                            <Link
                                href={item.href}
                                className="text-primary-700 hover:text-primary-900 transition-colors"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className="text-gray-700">{item.label}</span>
                        )}
                    </div>
                ))}
            </div>
        </nav>
    );
}
