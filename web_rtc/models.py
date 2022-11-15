from django.db import models
from django.db.models.signals import m2m_changed
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User

class StatusesChoices(models.TextChoices):
    Active = "Active", "Active"
    Inactive = "Inactive", "Inactive"
    Delete = "Delete", "Delete"
    

class SourcesChoices(models.TextChoices):
    Website = "Website", "Website"
    Android = "Android", "Android"
    iOS = "iOS", "Website"
    AMP = "AMP", "AMP"
    PWA = "PWA", "PWA"
    Desktop = "Desktop", "Desktop"

class Room(models.Model):
	users = models.ManyToManyField(User)
	source = models.CharField(max_length=10, choices=SourcesChoices.choices, default='Website')
	timestamp = models.DateTimeField(auto_now_add=True, editable=False)
	track = models.TextField(blank=True, editable=False)
	status = models.CharField(max_length=10, choices=StatusesChoices.choices, default='Active')

	# def clean(self, *args, **kwargs):
	# 	print(self.users.count())
	# 	if self.users.count() < 2:
	# 		raise ValidationError("You can't assign less than two Users")
	# 	super(Room, self).clean(*args, **kwargs)

	def __str__(self):
		users = ""
		for usr in self.users.all():
			users = users+usr.username+", "
		return str(users)


class ChatMessage(models.Model):
	room = models.ForeignKey(Room, on_delete=models.PROTECT)
	user = models.ForeignKey(User, on_delete=models.PROTECT)
	message = models.TextField()
	source = models.CharField(max_length=10, choices=SourcesChoices.choices, default='Website')
	timestamp = models.DateTimeField(auto_now_add=True, editable=False)
	track = models.TextField(blank=True, editable=False)
	status = models.CharField(max_length=10, choices=StatusesChoices.choices, default='Active')

	def __str__(self):
		return str(self.user)+" => "+str(self.message)

# def users_changed(sender, **kwargs):
# 	if kwargs['instance'].users.count() < 2:
# 		raise ValidationError("You can't assign less than two users")

# m2m_changed.connect(users_changed, sender=Room.users.through)
