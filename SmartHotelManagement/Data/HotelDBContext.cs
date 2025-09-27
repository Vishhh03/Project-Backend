using Microsoft.EntityFrameworkCore;
using SmartHotelManagement.Models;

public class HotelDBContext : DbContext
{
    public HotelDBContext(DbContextOptions<HotelDBContext> options) : base(options) { }

    // Define your tables as DbSet<T>
    public DbSet<User> Users { get; set; }
    public DbSet<Hotel> Hotels { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<LoyaltyAccount> LoyaltyAccounts { get; set; }
    public DbSet<Redemption> Redemptions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User entity configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Role).HasConversion<int>();
        });

        // Hotel entity configuration
        modelBuilder.Entity<Hotel>(entity =>
        {
            entity.HasKey(h => h.Id);
            entity.HasOne(h => h.Manager)
                  .WithMany()
                  .HasForeignKey(h => h.ManagerId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Room entity configuration
        modelBuilder.Entity<Room>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.HasOne(r => r.Hotel)
                  .WithMany(h => h.Rooms)
                  .HasForeignKey(r => r.HotelId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Booking entity configuration
        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.Property(b => b.Status).HasConversion<int>();
            entity.HasOne(b => b.User)
                  .WithMany(u => u.Bookings)
                  .HasForeignKey(b => b.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(b => b.Room)
                  .WithMany(r => r.Bookings)
                  .HasForeignKey(b => b.RoomId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Payment entity configuration
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Status).HasConversion<int>();
            entity.HasOne(p => p.User)
                  .WithMany()
                  .HasForeignKey(p => p.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(p => p.Booking)
                  .WithOne(b => b.Payment)
                  .HasForeignKey<Payment>(p => p.BookingId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Review entity configuration
        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.HasOne(r => r.User)
                  .WithMany(u => u.Reviews)
                  .HasForeignKey(r => r.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(r => r.Hotel)
                  .WithMany(h => h.Reviews)
                  .HasForeignKey(r => r.HotelId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // LoyaltyAccount entity configuration
        modelBuilder.Entity<LoyaltyAccount>(entity =>
        {
            entity.HasKey(l => l.Id);
            entity.HasOne(l => l.User)
                  .WithOne(u => u.LoyaltyAccount)
                  .HasForeignKey<LoyaltyAccount>(l => l.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Redemption entity configuration
        modelBuilder.Entity<Redemption>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.HasOne(r => r.User)
                  .WithMany()
                  .HasForeignKey(r => r.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(r => r.Booking)
                  .WithMany(b => b.Redemptions)
                  .HasForeignKey(r => r.BookingId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
