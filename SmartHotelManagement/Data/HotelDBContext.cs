// HotelDBContext.cs
using Microsoft.EntityFrameworkCore;
using SmartHotelManagement.Models;

public class HotelDBContext : DbContext
{
    public HotelDBContext(DbContextOptions<HotelDBContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Hotel> Hotels { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<RoomType> RoomTypes { get; set; }
    public DbSet<Amenity> Amenities { get; set; }
    public DbSet<RoomTypeAmenity> RoomTypeAmenities { get; set; }
    public DbSet<LoyaltyAccount> LoyaltyAccounts { get; set; }
    public DbSet<Availability> Availabilities { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Unique index for email
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Unique room number per hotel
        modelBuilder.Entity<Room>()
            .HasIndex(r => new { r.HotelId, r.RoomNumber })
            .IsUnique();

        // Composite key for many-to-many
        modelBuilder.Entity<RoomTypeAmenity>()
            .HasKey(rta => new { rta.RoomTypeId, rta.AmenityId });

        // Availability unique per room + date
        modelBuilder.Entity<Availability>()
            .HasIndex(a => new { a.RoomId, a.Date })
            .IsUnique();

        // Booking unique constraint (optional) - rely on logic
        modelBuilder.Entity<Booking>()
            .HasIndex(b => new { b.RoomId, b.CheckInDate, b.CheckOutDate });

        // Audit log
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => a.EntityType);

        modelBuilder.Entity<LoyaltyAccount>()
            .HasIndex(l => l.UserId)
            .IsUnique();

        modelBuilder.Entity<LoyaltyAccount>()
            .HasOne(l => l.User)
            .WithOne(u => u.LoyaltyAccount)
            .HasForeignKey<LoyaltyAccount>(l => l.UserId)
            .OnDelete(DeleteBehavior.Cascade);

    }
}
