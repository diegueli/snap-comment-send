
import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';

interface Producto {
  id: number;
  nombre: string | null;
}

interface ProductComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const ProductCombobox: React.FC<ProductComboboxProps> = ({
  value,
  onValueChange,
  placeholder = "Selecciona un producto...",
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre')
        .not('nombre', 'is', null)
        .order('nombre');

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error loading productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = productos.find((producto) => producto.id.toString() === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between border-red-200 focus:border-red-400", className)}
        >
          {selectedProduct ? selectedProduct.nombre : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command>
          <CommandInput placeholder="Buscar producto..." className="h-9" />
          <CommandList>
            <CommandEmpty>
              {loading ? "Cargando productos..." : "No se encontraron productos."}
            </CommandEmpty>
            <CommandGroup>
              {productos.map((producto) => (
                <CommandItem
                  key={producto.id}
                  value={`${producto.nombre} ${producto.id}`}
                  onSelect={() => {
                    onValueChange(producto.id.toString());
                    setOpen(false);
                  }}
                >
                  {producto.nombre}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === producto.id.toString() ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ProductCombobox;
