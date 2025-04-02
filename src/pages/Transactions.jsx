const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const items = [];
  const maxVisiblePages = 5;
  
  if (totalPages <= maxVisiblePages) {
    // Show all pages if less than maxVisiblePages
    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-3 py-1 rounded-md ${
            currentPage === i
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          {i}
        </button>
      );
    }
  } else {
    // Show first page
    items.push(
      <button
        key={1}
        onClick={() => onPageChange(1)}
        className={`px-3 py-1 rounded-md ${
          currentPage === 1
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        }`}
      >
        1
      </button>
    );
    
    // Add ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <span key="ellipsis-start" className="px-2">
          ...
        </span>
      );
    }
    
    // Add current page and adjacent pages
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-3 py-1 rounded-md ${
            currentPage === i
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(
        <span key="ellipsis-end" className="px-2">
          ...
        </span>
      );
    }
    
    // Show last page
    items.push(
      <button
        key={totalPages}
        onClick={() => onPageChange(totalPages)}
        className={`px-3 py-1 rounded-md ${
          currentPage === totalPages
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        }`}
      >
        {totalPages}
      </button>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      {currentPage > 1 && (
        <button
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
        >
          Previous
        </button>
      )}
      {items}
      {currentPage < totalPages && (
        <button
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
        >
          Next
        </button>
      )}
    </div>
  );
};

{salesTotalPages > 1 && (
  <div className="flex justify-center">
    <Pagination
      currentPage={salesCurrentPage}
      totalPages={salesTotalPages}
      onPageChange={handleSalesPageChange}
    />
  </div>
)}

{inventoryTotalPages > 1 && (
  <div className="flex justify-center">
    <Pagination
      currentPage={inventoryCurrentPage}
      totalPages={inventoryTotalPages}
      onPageChange={handleInventoryPageChange}
    />
  </div>
)} 